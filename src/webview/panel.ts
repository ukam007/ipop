import * as vscode from 'vscode';
import { TelnetConnection } from '../types';
import { TelnetClient } from '../telnet/client';
import { getWebviewContent, WebviewConfig } from './content';
import { WebviewMessage, ExtensionMessage } from './types';
import { getHistory } from '../completion/history';
import { getSymbolIndexer } from '../completion/indexer';
import { SessionLogger } from '../logger';
import { getShortcutConfig } from '../config/shortcuts';

export class IPOPWebViewPanel {
    private panel: vscode.WebviewPanel;
    private client: TelnetClient | undefined;
    private connection: TelnetConnection;
    private logger: SessionLogger | null = null;
    private disposables: vscode.Disposable[] = [];

    constructor(connection: TelnetConnection) {
        this.connection = connection;

        this.panel = vscode.window.createWebviewPanel(
            'ipopTerminal',
            `IPOP - ${connection.name}`,
            vscode.ViewColumn.Active,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        this.initializeLogger();
        this.setWebviewContent();
        this.setupMessageHandler();
        this.setupPanelDisposables();
        this.connectTelnet();
    }

    private initializeLogger(): void {
        try {
            const logConfig = vscode.workspace.getConfiguration('ipop.logging');
            if (logConfig.get<boolean>('enabled', true)) {
                const logDir = logConfig.get<string>('path', '');
                const defaultLogDir = this.getDefaultLogDir();
                this.logger = new SessionLogger(this.connection, logDir || defaultLogDir);
            }
        } catch (error) {
            console.error('Failed to create logger:', error);
            this.logger = null;
        }
    }

    private getDefaultLogDir(): string {
        const appData = process.env.APPDATA ||
            (process.platform === 'darwin'
                ? require('path').join(process.env.HOME || '', 'Library', 'Application Support')
                : require('path').join(process.env.HOME || '', '.config'));
        return require('path').join(appData, 'ipop', 'logs');
    }

    private setWebviewContent(): void {
        try {
            const shortcutConfig = getShortcutConfig();
            const themeConfig = vscode.workspace.getConfiguration('ipop.webview');
            const themeId = themeConfig.get<string>('theme', 'dark');
            
            const config: WebviewConfig = {
                sendShortcut: shortcutConfig.getSendShortcut(),
                maxHistorySize: shortcutConfig.getMaxHistorySize(),
                autoScroll: shortcutConfig.getAutoScroll(),
                inputMaxHeight: shortcutConfig.getInputMaxHeight(),
                maxOutputLines: shortcutConfig.getMaxOutputLines(),
                themeId: themeId
            };
            
            this.panel.webview.html = getWebviewContent(this.panel.webview, {
                name: this.connection.name,
                host: this.connection.host,
                port: this.connection.port,
                encoding: this.connection.encoding
            }, config);
        } catch (error) {
            console.error('Failed to get shortcut config:', error);
            // Fallback to default config
            const defaultConfig: WebviewConfig = {
                sendShortcut: 'F8',
                maxHistorySize: 100,
                autoScroll: true,
                inputMaxHeight: 400,
                maxOutputLines: 1000,
                themeId: 'dark'
            };
            
            this.panel.webview.html = getWebviewContent(this.panel.webview, {
                name: this.connection.name,
                host: this.connection.host,
                port: this.connection.port,
                encoding: this.connection.encoding
            }, defaultConfig);
        }
    }

    private setupMessageHandler(): void {
        this.panel.webview.onDidReceiveMessage(
            async (message: WebviewMessage) => {
                await this.handleWebviewMessage(message);
            },
            null,
            this.disposables
        );
    }

    private async handleWebviewMessage(message: WebviewMessage): Promise<void> {
        switch (message.command) {
            case 'sendCommand':
                this.sendCommand(message.text || '');
                break;

            case 'requestCompletion':
                this.provideCompletion(message.text || '');
                break;

            case 'requestHistory':
                this.sendHistoryList();
                break;

            case 'clearOutput':
                if (this.logger) {
                    this.logger.close();
                    this.initializeLogger();
                }
                break;

            case 'reconnect':
                this.reconnect();
                break;

            case 'saveHistory':
                if (message.text) {
                    getHistory().recordCommand(message.text, 'user');
                }
                break;

            case 'saveTheme':
                if (message.theme) {
                    const themeConfig = vscode.workspace.getConfiguration('ipop.webview');
                    themeConfig.update('theme', message.theme, vscode.ConfigurationTarget.Global);
                }
                break;
        }
    }

    private sendCommand(cmd: string): void {
        if (!this.client || !this.client.isConnected()) {
            this.sendMessage({
                command: 'outputResponse',
                text: 'Error: Not connected\r\n'
            });
            return;
        }

        if (this.logger) {
            this.logger.logInput(cmd);
        }

        try {
            getHistory().recordCommand(cmd, 'user');
        } catch {}

        this.client.send(cmd);
    }

    private provideCompletion(partial: string): void {
        try {
            const indexer = getSymbolIndexer();
            const symbols = indexer.search(partial);

            if (symbols.length > 0) {
                const completion = symbols[0].insertText;
                this.sendMessage({
                    command: 'completionResult',
                    completion
                });
            }
        } catch (error) {
            console.error('Completion error:', error);
        }
    }

    private sendHistoryList(): void {
        try {
            const history = getHistory();
            const recentCommands = history.getRecentCommands(50);

            this.sendMessage({
                command: 'historyList',
                history: recentCommands
            });
        } catch (error) {
            console.error('History error:', error);
        }
    }

    private connectTelnet(): void {
        try {
            const config = vscode.workspace.getConfiguration('ipop.telnet');
            const timeout = config.get<number>('timeout', 5000);
            const keepaliveInterval = config.get<number>('keepaliveInterval', 30000);

            this.client = new TelnetClient(
                this.connection.host,
                this.connection.port,
                this.connection.encoding,
                {
                    onConnect: () => {
                        this.sendMessage({
                            command: 'connectionStatus',
                            status: 'connected'
                        });
                    },
                    onData: (data: string) => {
                        if (this.logger) {
                            this.logger.logOutput(data);
                        }

                        this.sendMessage({
                            command: 'outputResponse',
                            text: data
                        });
                    },
                    onDisconnect: () => {
                        this.sendMessage({
                            command: 'connectionStatus',
                            status: 'disconnected',
                            canReconnect: true
                        });
                    },
                    onError: (error: Error) => {
                        this.sendMessage({
                            command: 'outputResponse',
                            text: `Error: ${error.message}\r\n`
                        });

                        this.sendMessage({
                            command: 'connectionStatus',
                            status: 'disconnected',
                            canReconnect: true
                        });
                    }
                },
                timeout,
                keepaliveInterval
            );

            this.client.connect().catch((error: Error) => {
                this.sendMessage({
                    command: 'outputResponse',
                    text: `Connection failed: ${error.message}\r\n`
                });

                this.sendMessage({
                    command: 'connectionStatus',
                    status: 'disconnected',
                    canReconnect: true
                });
            });
        } catch (error) {
            this.sendMessage({
                command: 'outputResponse',
                text: `Connection failed: ${error}\r\n`
            });
        }
    }

    private reconnect(): void {
        if (this.client) {
            this.client.disconnect();
            this.client = undefined;
        }

        this.connectTelnet();
    }

    private sendMessage(message: ExtensionMessage): void {
        if (this.panel) {
            this.panel.webview.postMessage(message);
        }
    }

    private setupPanelDisposables(): void {
        this.panel.onDidDispose(
            () => {
                this.dispose();
            },
            null,
            this.disposables
        );
    }

    public show(): void {
        this.panel.reveal(vscode.ViewColumn.Active);
    }

    public dispose(): void {
        if (this.client) {
            this.client.disconnect();
            this.client = undefined;
        }

        if (this.logger) {
            this.logger.close();
        }

        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }

        this.panel.dispose();

        WebViewPanelRegistry.getInstance().delete(this.connection.id);
    }

    public getConnection(): TelnetConnection {
        return this.connection;
    }
}

export class WebViewPanelRegistry {
    private static instance: WebViewPanelRegistry;
    private panels: Map<string, IPOPWebViewPanel> = new Map();

    private constructor() {}

    public static getInstance(): WebViewPanelRegistry {
        if (!WebViewPanelRegistry.instance) {
            WebViewPanelRegistry.instance = new WebViewPanelRegistry();
        }
        return WebViewPanelRegistry.instance;
    }

    public create(connection: TelnetConnection): IPOPWebViewPanel {
        const existing = this.panels.get(connection.id);
        if (existing) {
            existing.show();
            return existing;
        }

        const panel = new IPOPWebViewPanel(connection);
        this.panels.set(connection.id, panel);
        return panel;
    }

    public get(id: string): IPOPWebViewPanel | undefined {
        return this.panels.get(id);
    }

    public delete(id: string): void {
        this.panels.delete(id);
    }

    public has(id: string): boolean {
        return this.panels.has(id);
    }

    public getAll(): IPOPWebViewPanel[] {
        return Array.from(this.panels.values());
    }
}