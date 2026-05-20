import * as net from 'net';
import * as vscode from 'vscode';
import * as iconv from 'iconv-lite';
import { Encoding, TelnetClientEvents } from '../types';

const IAC = 0xFF;
const WILL = 0xFB;
const WONT = 0xFC;
const DO = 0xFD;
const DONT = 0xFE;
const SB = 0xFA;
const SE = 0xF0;
const NOP = 0xF0;

const OPT_ECHO = 1;
const OPT_SUPPRESS_GO_AHEAD = 3;
const OPT_TIMING_MARK = 6;
const OPT_TERMINAL_TYPE = 24;
const OPT_WINDOW_SIZE = 31;

export class TelnetClient {
    private socket: net.Socket | null = null;
    private connected = false;
    private buffer: Buffer = Buffer.alloc(0);
    private events: TelnetClientEvents;
    private encoding: Encoding;
    private host: string;
    private port: number;
    private timeout: number;
    private keepaliveTimer: NodeJS.Timeout | null = null;
    private keepaliveInterval: number = 0;

    constructor(
        host: string,
        port: number,
        encoding: Encoding,
        events: TelnetClientEvents,
        timeout = 10000,
        keepaliveInterval = 10000
    ) {
        this.host = host;
        this.port = port;
        this.encoding = encoding;
        this.events = events;
        this.timeout = timeout;
        this.keepaliveInterval = keepaliveInterval;
    }

    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.socket = new net.Socket();
            this.socket.setTimeout(this.timeout);

            const timeoutId = setTimeout(() => {
                this.socket?.destroy();
                reject(new Error('Connection timeout'));
            }, this.timeout);

this.socket.on('connect', () => {
            clearTimeout(timeoutId);
            
            if (this.socket) {
                this.socket.setTimeout(0);
            }
            
            this.connected = true;
            this.events.onConnect();
            
            this.startKeepalive();
            
            resolve();
        });

            this.socket.on('data', (data: Buffer) => {
                this.handleData(data);
            });

            this.socket.on('error', (err: Error) => {
                clearTimeout(timeoutId);
                this.events.onError(err);
            });

this.socket.on('close', (hadError: boolean) => {
            this.connected = false;
            this.stopKeepalive();
            if (hadError) {
                this.events.onError(new Error('Connection closed with error'));
            }
            this.events.onDisconnect();
        });

        this.socket.on('timeout', () => {
            clearTimeout(timeoutId);
            this.socket?.destroy();
            reject(new Error('Connection timeout'));
        });

            this.socket.connect(this.port, this.host);
        });
    }

    private handleData(data: Buffer): void {
        this.buffer = Buffer.concat([this.buffer, data]);
        this.processBuffer();
    }

    private processBuffer(): void {
        let output = Buffer.alloc(0);
        let i = 0;

        while (i < this.buffer.length) {
            if (this.buffer[i] === IAC) {
                if (i + 1 >= this.buffer.length) break;

                const cmd = this.buffer[i + 1];

                if (cmd === IAC) {
                    output = Buffer.concat([output, Buffer.from([IAC])]);
                    i += 2;
                    continue;
                }

                if (cmd === WILL || cmd === WONT || cmd === DO || cmd === DONT) {
                    if (i + 2 >= this.buffer.length) break;
                    const option = this.buffer[i + 2];
                    this.handleTelnetCommand(cmd, option);
                    i += 3;
                    continue;
                }

                if (cmd === SB) {
                    const seIndex = this.buffer.indexOf(SE, i + 2);
                    if (seIndex === -1) break;
                    i = seIndex + 1;
                    continue;
                }

                i += 2;
            } else {
                output = Buffer.concat([output, this.buffer.slice(i, i + 1)]);
                i += 1;
            }
        }

        this.buffer = this.buffer.slice(i);

        if (output.length > 0) {
            const text = iconv.decode(output, this.encoding);
            this.events.onData(text);
        }
    }

    private handleTelnetCommand(cmd: number, option: number): void {
        if (!this.socket) return;

        if (cmd === DO) {
            if (option === OPT_ECHO || option === OPT_SUPPRESS_GO_AHEAD) {
                this.socket.write(Buffer.from([IAC, WILL, option]));
            } else if (option === OPT_TIMING_MARK) {
                this.socket.write(Buffer.from([IAC, WILL, option]));
            } else if (option === OPT_WINDOW_SIZE) {
                this.socket.write(Buffer.from([IAC, WILL, option]));
                this.sendWindowSize();
            } else {
                this.socket.write(Buffer.from([IAC, WONT, option]));
            }
        } else if (cmd === DONT) {
            this.socket.write(Buffer.from([IAC, WONT, option]));
        } else if (cmd === WILL) {
            if (option === OPT_ECHO) {
                this.socket.write(Buffer.from([IAC, DO, option]));
            } else if (option === OPT_SUPPRESS_GO_AHEAD) {
                this.socket.write(Buffer.from([IAC, DO, option]));
            } else {
                this.socket.write(Buffer.from([IAC, DONT, option]));
            }
        } else if (cmd === WONT) {
            this.socket.write(Buffer.from([IAC, DONT, option]));
        }
    }

    private sendWindowSize(): void {
        if (!this.socket) return;
        const width = 80;
        const height = 24;
        const buf = Buffer.from([
            IAC, SB, OPT_WINDOW_SIZE,
            0, width,
            0, height,
            IAC, SE
        ]);
        this.socket.write(buf);
    }

    send(data: string): void {
        if (!this.socket || !this.connected) {
            throw new Error('Not connected');
        }

        const encoded = iconv.encode(data + '\r\n', this.encoding);
        this.socket.write(encoded);
    }

    sendRaw(data: string): void {
        if (!this.socket || !this.connected) {
            throw new Error('Not connected');
        }

        const encoded = iconv.encode(data, this.encoding);
        this.socket.write(encoded);
    }

    disconnect(): void {
        this.stopKeepalive();
        if (this.socket) {
            this.socket.destroy();
            this.socket = null;
            this.connected = false;
        }
    }

    isConnected(): boolean {
        return this.connected;
    }

    getHost(): string {
        return this.host;
    }

    getPort(): number {
        return this.port;
    }

    private startKeepalive(): void {
        if (this.keepaliveInterval > 0 && this.socket) {
            this.keepaliveTimer = setInterval(() => {
                if (this.connected && this.socket) {
                    this.socket.write(Buffer.from([IAC, NOP]));
                }
            }, this.keepaliveInterval);
        }
    }

    private stopKeepalive(): void {
        if (this.keepaliveTimer) {
            clearInterval(this.keepaliveTimer);
            this.keepaliveTimer = null;
        }
    }
}