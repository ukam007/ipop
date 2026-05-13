import * as vscode from 'vscode';
import { TelnetClient } from '../telnet/client';
import { TelnetConnection, ConnectionStatus } from '../types';

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

    constructor(connection: TelnetConnection) {
        this.connection = connection;
    }

    open(_initialDimensions: vscode.TerminalDimensions | undefined): void {
        this.connect();
    }

    close(): void {
        if (this.client && this.client.isConnected()) {
            this.client.disconnect();
            this.client = undefined;
        }
        this.status = 'disconnected';
    }

    handleInput(data: string): void {
        if (data === '\r') {
            if (this.client && this.client.isConnected()) {
                this.client.send(this.inputBuffer);
            }
            this.writeEmitter.fire('\r\n');
            this.inputBuffer = '';
        } else if (data === '\x7f' || data === '\b') {
            if (this.inputBuffer.length > 0) {
                this.inputBuffer = this.inputBuffer.slice(0, -1);
                this.writeEmitter.fire('\b \b');
            }
        } else if (data.charCodeAt(0) === 3) {
            if (this.client && this.client.isConnected()) {
                this.client.sendRaw('\x03');
            }
            this.writeEmitter.fire('^C\r\n');
        } else if (data.charCodeAt(0) >= 32) {
            this.inputBuffer += data;
            this.writeEmitter.fire(data);
        }
    }

    private connect(): void {
        this.status = 'connecting';
        this.writeEmitter.fire(`Connecting to ${this.connection.host}:${this.connection.port}...\r\n`);

        const config = vscode.workspace.getConfiguration('ipop.telnet');
        const timeout = config.get<number>('timeout', 30000);

        this.client = new TelnetClient(
            this.connection.host,
            this.connection.port,
            this.connection.encoding,
            {
                onConnect: () => {
                    this.status = 'connected';
                    this.writeEmitter.fire(`Connected to ${this.connection.host}:${this.connection.port}\r\n`);
                    this.writeEmitter.fire('Type commands and press Enter to send.\r\n');
                },
                onDisconnect: () => {
                    this.status = 'disconnected';
                    this.writeEmitter.fire('\r\nConnection closed by remote host.\r\n');
                    this.writeEmitter.fire('Press any key to reconnect, or close terminal to exit.\r\n');
                    this.client = undefined;
                },
                onData: (data: string) => {
                    this.writeEmitter.fire(data);
                },
                onError: (error: Error) => {
                    this.writeEmitter.fire(`\r\nError: ${error.message}\r\n`);
                }
            },
            timeout
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