import * as vscode from 'vscode';
import * as path from 'path';
import { TelnetClient } from '../telnet/client';
import { TelnetConnection, ConnectionStatus } from '../types';
import { getTabHelper } from '../completion/provider';
import { getHistory } from '../completion/history';
import { 
    isTabCompletionEnabled, 
    getMinTriggerChars, 
    isShowHintEnabled,
    isAutoCompletionEnabled
} from '../completion/terminal-filter';
import { SessionLogger } from '../logger';

const ANSI_RESET = '\x1b[0m';
const ANSI_GREEN = '\x1b[32m';
const ANSI_RED = '\x1b[31m';
const ANSI_YELLOW = '\x1b[33m';
const ANSI_CYAN = '\x1b[36m';
const ANSI_BOLD = '\x1b[1m';
const ANSI_DIM = '\x1b[2m';

export class TerminalManager implements vscode.Pseudoterminal {
    private writeEmitter = new vscode.EventEmitter<string>();
    onDidWrite: vscode.Event<string> = this.writeEmitter.event;
    private closeEmitter = new vscode.EventEmitter<number>();
    onDidClose: vscode.Event<number> = this.closeEmitter.event;

    private terminal: vscode.Terminal | undefined;
    private client: TelnetClient | undefined;
    private connection: TelnetConnection;
    private status: ConnectionStatus = 'disconnected';
    private inputBuffer: string = '';
    private hintShown: boolean = false;
    private lastHintLength: number = 0;
    private lastHintText: string = '';
    private logger: SessionLogger | null = null;
    private inlineCompletionMode: boolean = false;
    private originalInput: string = '';
    private escapeBuffer: string = '';
    private historyIndex: number = -1;
    private historyMatches: string[] = [];
    private savedInputBeforeHistory: string = '';
    private lastSentCommand: string = '';

    constructor(connection: TelnetConnection) {
        this.connection = connection;
        
        try {
            const logConfig = vscode.workspace.getConfiguration('ipop.logging');
            if (logConfig.get<boolean>('enabled', true)) {
                const logDir = logConfig.get<string>('path', '');
                const defaultLogDir = this.getDefaultLogDir();
                this.logger = new SessionLogger(connection, logDir || defaultLogDir);
            }
        } catch (error) {
            console.error('Failed to create logger:', error);
            this.logger = null;
        }
    }

    private getDefaultLogDir(): string {
        const appData = process.env.APPDATA || 
                        (process.platform === 'darwin' 
                            ? path.join(process.env.HOME || '', 'Library', 'Application Support')
                            : path.join(process.env.HOME || '', '.config'));
        return path.join(appData, 'ipop', 'logs');
    }

    open(_initialDimensions: vscode.TerminalDimensions | undefined): void {
        this.connect();
    }

    close(): void {
        if (this.client && this.client.isConnected()) {
            this.client.disconnect();
            this.client = undefined;
        }
        if (this.logger) {
            this.logger.close();
        }
        this.status = 'disconnected';
    }

    handleInput(data: string): void {
        if (this.status !== 'connected') {
            if (data.charCodeAt(0) >= 32 || data === '\r') {
                this.reconnect();
            }
            return;
        }

        if (!this.client || !this.client.isConnected()) {
            return;
        }

        if (data.startsWith('\x1b')) {
            this.handleEscapeSequence(data);
            return;
        }

        if (data === '\t') {
            this.handleTabCompletion();
            return;
        }

        if (data === '\r') {
            // 记录发送的命令，用于后续清除冗余回显
            this.lastSentCommand = this.inputBuffer;
            
            // 不输出 \r\n，让服务器响应自然换行
            if (this.logger) {
                this.logger.logInput(this.inputBuffer);
            }
            try {
                getHistory().recordCommand(this.inputBuffer, 'user');
            } catch {}
            this.client.send(this.inputBuffer);
            this.inputBuffer = '';
            this.hintShown = false;
            this.lastHintLength = 0;
            this.lastHintText = '';
            this.inlineCompletionMode = false;
            this.historyIndex = -1;
            this.historyMatches = [];
        } else if (data === '\x7f' || data === '\b') {
            if (this.inputBuffer.length > 0) {
                this.inputBuffer = this.inputBuffer.slice(0, -1);
                this.inlineCompletionMode = false;
                
                if (this.inputBuffer.length < this.lastHintLength) {
                    this.hintShown = false;
                }
                
                if (this.inputBuffer.length >= getMinTriggerChars()) {
                    this.checkAndShowHint();
                } else {
                    this.clearInlineHint();
                }
            }
        } else if (data.charCodeAt(0) === 3) {
            this.clearInlineHint();
            this.writeEmitter.fire('\r\n');
            if (this.logger) {
                this.logger.logInput('^C');
            }
            this.client.sendRaw('\x03');
            this.writeEmitter.fire(`${ANSI_YELLOW}^C${ANSI_RESET}\r\n`);
            this.inputBuffer = '';
            this.hintShown = false;
            this.lastHintLength = 0;
            this.lastHintText = '';
            this.inlineCompletionMode = false;
        } else if (data.charCodeAt(0) >= 32) {
            const code = data.charCodeAt(0);
            if (code === 0xFEFF || code === 0x200B || code === 0x200C || 
                code === 0x200D || code === 0x2060 || code === 0x00AD) {
                return;
            }
            this.inputBuffer += data;
            this.inlineCompletionMode = false;
            this.historyIndex = -1;
            this.historyMatches = [];
            
            this.checkAndShowHint();
        }
    }

    private handleEscapeSequence(data: string): void {
        if (data === '\x1b[A' || data === '\x1bOA') {
            if (this.inputBuffer.length >= getMinTriggerChars()) {
                this.cycleCompletion(true);
            } else {
                this.navigateHistory(true);
            }
        } else if (data === '\x1b[B' || data === '\x1bOB') {
            if (this.inputBuffer.length >= getMinTriggerChars()) {
                this.cycleCompletion(false);
            } else {
                this.navigateHistory(false);
            }
        }
    }

    private navigateHistory(backward: boolean): void {
        try {
            const history = getHistory();
            
            if (this.historyIndex === -1) {
                this.savedInputBeforeHistory = this.inputBuffer;
                this.historyMatches = history.getRecentCommands(50);
                this.historyIndex = backward ? 0 : this.historyMatches.length - 1;
            } else {
                if (backward) {
                    this.historyIndex = Math.min(this.historyIndex + 1, this.historyMatches.length - 1);
                } else {
                    this.historyIndex = Math.max(this.historyIndex - 1, -1);
                }
            }
            
            if (this.historyIndex >= 0 && this.historyIndex < this.historyMatches.length) {
                const cmd = this.historyMatches[this.historyIndex];
                this.displayInputBuffer(cmd);
            } else if (this.historyIndex === -1) {
                this.displayInputBuffer(this.savedInputBeforeHistory);
                this.historyMatches = [];
            }
        } catch {}
    }

    private displayInputBuffer(newBuffer: string): void {
        const prompt = `${this.connection.host}:${this.connection.port}> `;
        
        this.writeEmitter.fire('\r');
        this.writeEmitter.fire('\x1b[K');
        this.writeEmitter.fire(prompt);
        this.writeEmitter.fire(newBuffer);
        
        this.inputBuffer = newBuffer;
    }

    private cycleCompletion(forward: boolean): void {
        if (!isTabCompletionEnabled()) {
            return;
        }

        const minChars = getMinTriggerChars();
        if (this.inputBuffer.length < minChars) {
            return;
        }

        if (!this.inlineCompletionMode) {
            this.originalInput = this.inputBuffer;
            this.inlineCompletionMode = true;
        }

        const suggestion = getTabHelper().cycleInlineCompletion(this.originalInput, forward);
        
        if (suggestion) {
            const oldLen = this.inputBuffer.length;
            this.inputBuffer = suggestion;
            
            for (let i = 0; i < oldLen; i++) {
                this.writeEmitter.fire('\b \b');
            }
            this.writeEmitter.fire(`${ANSI_DIM}${suggestion}${ANSI_RESET}`);
            
            const clearLen = suggestion.length;
            this.writeEmitter.fire(`\x1b[${clearLen}D`);
            this.writeEmitter.fire(suggestion);
        }
    }

    private connect(): void {
        this.status = 'connecting';
        this.writeEmitter.fire(`${ANSI_YELLOW}⏳ Connecting to ${this.connection.host}:${this.connection.port}...${ANSI_RESET}\r\n`);

        const config = vscode.workspace.getConfiguration('ipop.telnet');
        const timeout = config.get<number>('timeout', 30000);
        const keepaliveInterval = config.get<number>('keepaliveInterval', 0);

        this.client = new TelnetClient(
            this.connection.host,
            this.connection.port,
            this.connection.encoding,
            {
                onConnect: () => {
                    this.status = 'connected';
                    if (this.logger) {
                        this.logger.logConnect(keepaliveInterval);
                    }
                    this.writeEmitter.fire(`${ANSI_GREEN}${ANSI_BOLD}✓ Connected to ${this.connection.host}:${this.connection.port}${ANSI_RESET}\r\n`);
                    this.writeEmitter.fire(`${ANSI_CYAN}Type commands and press Enter to send.${ANSI_RESET}\r\n`);
                    if (keepaliveInterval > 0) {
                        this.writeEmitter.fire(`${ANSI_GREEN}Keepalive enabled (${keepaliveInterval}ms interval)${ANSI_RESET}\r\n`);
                    }
                },
                onDisconnect: () => {
                    const prevStatus = this.status;
                    this.status = 'disconnected';
                    
                    if (prevStatus === 'connected') {
                        if (this.logger) {
                            this.logger.logDisconnect('Connection closed by remote host');
                        }
                        this.writeEmitter.fire('\r\n');
                        this.writeEmitter.fire(`${ANSI_RED}${ANSI_BOLD}========================================${ANSI_RESET}\r\n`);
                        this.writeEmitter.fire(`${ANSI_RED}${ANSI_BOLD}✗ Connection closed by remote host${ANSI_RESET}\r\n`);
                        this.writeEmitter.fire(`${ANSI_RED}${ANSI_BOLD}========================================${ANSI_RESET}\r\n`);
                        this.writeEmitter.fire('\r\n');
                        this.writeEmitter.fire(`${ANSI_YELLOW}Possible reasons:${ANSI_RESET}\r\n`);
                        this.writeEmitter.fire('  - Server idle timeout\r\n');
                        this.writeEmitter.fire('  - Network disconnection\r\n');
                        this.writeEmitter.fire('  - Server closed the session\r\n');
                        this.writeEmitter.fire('\r\n');
                        this.writeEmitter.fire(`${ANSI_CYAN}Press any key to reconnect, or close terminal.${ANSI_RESET}\r\n`);
                    }
                    this.client = undefined;
                },
                onData: (data: string) => {
                    if (this.logger) {
                        this.logger.logOutput(data);
                    }
                    
                    // 检查服务器回显是否包含用户输入，如果包含则清除冗余部分
                    if (this.lastSentCommand && data.includes(this.lastSentCommand)) {
                        // 转义特殊字符用于正则表达式，匹配命令后的所有连续换行符，保留一个用于换行
                        const escaped = this.lastSentCommand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        const regex = new RegExp(escaped + '(\\r\\n)+', 'g');
                        const cleanData = data.replace(regex, '\r\n');
                        this.writeEmitter.fire(cleanData);
                        this.lastSentCommand = '';
                    } else {
                        this.writeEmitter.fire(data);
                    }
                },
                onError: (error: Error) => {
                    if (this.logger) {
                        this.logger.logError(error);
                    }
                    this.writeEmitter.fire('\r\n');
                    this.writeEmitter.fire(`${ANSI_RED}${ANSI_BOLD}✗ Error: ${error.message}${ANSI_RESET}\r\n`);
                    this.writeEmitter.fire('\r\n');
                }
            },
            timeout,
            keepaliveInterval
        );

        this.client.connect().catch((error: Error) => {
            this.writeEmitter.fire(`\r\nConnection failed: ${error.message}\r\n`);
            this.status = 'disconnected';
            this.writeEmitter.fire('Press any key to retry, or close terminal to exit.\r\n');
            this.client = undefined;
        });
    }

    reconnect(): void {
        if (this.status !== 'connected' && !this.client) {
            this.connect();
        }
    }

    private checkAndShowHint(): void {
        if (!isShowHintEnabled() || !isAutoCompletionEnabled()) {
            return;
        }

        const minChars = getMinTriggerChars();
        
        if (this.inputBuffer.length >= minChars) {
            const matchCount = getTabHelper().quickSearch(this.inputBuffer);
            
            if (matchCount > 0) {
                const previewMatch = getTabHelper().getPreviewMatch(this.inputBuffer);
                const newHint = this.formatHintText(matchCount, previewMatch);
                
                this.updateInlineHint(newHint);
                this.lastHintText = newHint;
                this.hintShown = true;
                this.lastHintLength = this.inputBuffer.length;
            } else {
                this.clearInlineHint();
            }
        } else {
            this.clearInlineHint();
        }
    }

    private formatHintText(count: number, preview: string | null): string {
        const previewText = preview ? ` → ${preview}` : '';
        return `💡 ${count}${previewText}`;
    }

    private updateInlineHint(newHint: string): void {
        const prompt = `${this.connection.host}:${this.connection.port}> `;
        const inputLen = this.inputBuffer.length;
        const hintText = `  ${newHint}`;
        
        this.writeEmitter.fire('\r');
        this.writeEmitter.fire('\x1b[K');
        this.writeEmitter.fire(prompt);
        this.writeEmitter.fire(this.inputBuffer);
        this.writeEmitter.fire(`${ANSI_DIM}${hintText}${ANSI_RESET}`);
        
        for (let i = 0; i < hintText.length; i++) {
            this.writeEmitter.fire('\b');
        }
    }

    private clearInlineHint(): void {
        const prompt = `${this.connection.host}:${this.connection.port}> `;
        
        this.writeEmitter.fire('\r');
        this.writeEmitter.fire('\x1b[K');
        this.writeEmitter.fire(prompt);
        this.writeEmitter.fire(this.inputBuffer);
        
        this.lastHintText = '';
    }

    private async handleTabCompletion(): Promise<void> {
        if (!isTabCompletionEnabled()) {
            return;
        }

        this.clearInlineHint();

        const query = this.inputBuffer;
        const minChars = getMinTriggerChars();

        if (query.length < minChars) {
            this.writeEmitter.fire('\r\n');
            this.writeEmitter.fire(`Tab completion requires at least ${minChars} characters\r\n`);
            this.writeEmitter.fire(`${this.connection.host}:${this.connection.port}> ${this.inputBuffer}`);
            return;
        }

        this.writeEmitter.fire('\r\n');
        this.writeEmitter.fire(`Searching: "${query}"...\r\n`);

        try {
            const insertText = await getTabHelper().showCompletionPicker(query);

            if (insertText) {
                this.inputBuffer = insertText;
                this.hintShown = false;
                this.lastHintLength = 0;
                this.writeEmitter.fire(`✓ Completed: ${insertText}\r\n`);
                this.writeEmitter.fire(`${this.connection.host}:${this.connection.port}> ${insertText}`);
            } else {
                this.writeEmitter.fire('No selection made\r\n');
                this.writeEmitter.fire(`${this.connection.host}:${this.connection.port}> ${query}`);
            }
        } catch (error) {
            this.writeEmitter.fire(`Completion error: ${error}\r\n`);
            this.writeEmitter.fire(`${this.connection.host}:${this.connection.port}> ${query}`);
        }
    }

    disconnect(): void {
        if (this.client) {
            this.client.disconnect();
            this.client = undefined;
        }
        this.status = 'disconnected';
    }

    sendCommand(command: string): void {
        if (this.client && this.client.isConnected()) {
            this.client.send(command);
        }
    }

    getStatus(): ConnectionStatus {
        return this.status;
    }

    getConnection(): TelnetConnection {
        return this.connection;
    }

    setTerminal(terminal: vscode.Terminal): void {
        this.terminal = terminal;
    }

    getTerminal(): vscode.Terminal | undefined {
        return this.terminal;
    }

    getInputBuffer(): string {
        return this.inputBuffer;
    }

    setInputBuffer(text: string): void {
        this.inputBuffer = text;
    }

    clearInputBuffer(): void {
        this.inputBuffer = '';
    }
}

class TerminalManagerRegistry {
    private managers: Map<string, TerminalManager> = new Map();

    create(connection: TelnetConnection): vscode.Terminal {
        const manager = new TerminalManager(connection);
        const terminal = vscode.window.createTerminal({
            name: `${connection.name} (${connection.host}:${connection.port})`,
            pty: manager
        });
        manager.setTerminal(terminal);
        this.managers.set(connection.id, manager);
        return terminal;
    }

    get(connectionId: string): TerminalManager | undefined {
        return this.managers.get(connectionId);
    }

    delete(connectionId: string): void {
        const manager = this.managers.get(connectionId);
        if (manager) {
            manager.disconnect();
            this.managers.delete(connectionId);
        }
    }

    getAll(): Map<string, TerminalManager> {
        return this.managers;
    }
}

let registry: TerminalManagerRegistry | undefined;

export function getTerminalRegistry(): TerminalManagerRegistry {
    if (!registry) {
        registry = new TerminalManagerRegistry();
    }
    return registry;
}