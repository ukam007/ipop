import * as vscode from 'vscode';
import * as path from 'path';
import { TelnetClient } from '../telnet/client';
import { TelnetConnection, ConnectionStatus } from '../types';
import { getTabHelper } from '../completion/provider';
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
    private logger: SessionLogger | null = null;

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

        if (data === '\t') {
            this.handleTabCompletion();
            return;
        }

        if (data === '\r') {
            if (this.logger) {
                this.logger.logInput(this.inputBuffer);
            }
            this.writeEmitter.fire('\r\n');
            this.client.send(this.inputBuffer);
            this.inputBuffer = '';
            this.hintShown = false;
            this.lastHintLength = 0;
        } else if (data === '\x7f' || data === '\b') {
            if (this.inputBuffer.length > 0) {
                this.inputBuffer = this.inputBuffer.slice(0, -1);
                this.writeEmitter.fire('\b \b');
                
                if (this.inputBuffer.length < this.lastHintLength) {
                    this.hintShown = false;
                }
            }
        } else if (data.charCodeAt(0) === 3) {
            if (this.logger) {
                this.logger.logInput('^C');
            }
            this.client.sendRaw('\x03');
            this.writeEmitter.fire(`${ANSI_YELLOW}^C${ANSI_RESET}\r\n`);
            this.inputBuffer = '';
            this.hintShown = false;
            this.lastHintLength = 0;
        } else if (data.charCodeAt(0) >= 32) {
            const code = data.charCodeAt(0);
            if (code === 0xFEFF || code === 0x200B || code === 0x200C || 
                code === 0x200D || code === 0x2060 || code === 0x00AD) {
                return;
            }
            this.inputBuffer += data;
            this.writeEmitter.fire(data);
            
            this.checkAndShowHint();
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
                    this.writeEmitter.fire(data);
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
        
        if (this.inputBuffer.length >= minChars && !this.hintShown) {
            const matchCount = getTabHelper().quickSearch(this.inputBuffer);
            
            if (matchCount > 0) {
                this.showCompletionHint(this.inputBuffer, matchCount);
                this.hintShown = true;
                this.lastHintLength = this.inputBuffer.length;
            }
        }
    }

    private showCompletionHint(query: string, count: number): void {
        const previewMatch = getTabHelper().getPreviewMatch(query);
        const previewText = previewMatch ? ` → ${previewMatch}` : '';
        this.writeEmitter.fire(`\r\n${ANSI_YELLOW}💡 ${count} matches${previewText}${ANSI_RESET}\r\n`);
        this.writeEmitter.fire(`${this.connection.host}:${this.connection.port}> ${this.inputBuffer}`);
    }

    private async handleTabCompletion(): Promise<void> {
        if (!isTabCompletionEnabled()) {
            return;
        }

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