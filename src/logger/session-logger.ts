import * as fs from 'fs';
import * as path from 'path';
import { TelnetConnection } from '../types';

export enum LogEventType {
    CONNECT = 'CONNECT',
    DISCONNECT = 'DISCONNECT',
    INPUT = 'INPUT',
    OUTPUT = 'OUTPUT',
    ERROR = 'ERROR'
}

export class SessionLogger {
    private logFilePath: string;
    private connection: TelnetConnection;
    private enabled: boolean;
    private writeStream: fs.WriteStream | null = null;

    constructor(connection: TelnetConnection, logDir: string) {
        this.connection = connection;
        this.enabled = true;
        
        const timestamp = this.getTimestamp();
        const fileName = `session-${connection.name}-${connection.host}-${connection.port}-${timestamp}.log`;
        this.logFilePath = path.join(logDir, fileName);
    }

    private getTimestamp(): string {
        const now = new Date();
        const YYYY = now.getFullYear();
        const MM = String(now.getMonth() + 1).padStart(2, '0');
        const DD = String(now.getDate()).padStart(2, '0');
        const HH = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        return `${YYYY}${MM}${DD}-${HH}${mm}${ss}`;
    }

    private formatTimestamp(): string {
        const now = new Date();
        const YYYY = now.getFullYear();
        const MM = String(now.getMonth() + 1).padStart(2, '0');
        const DD = String(now.getDate()).padStart(2, '0');
        const HH = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        const ms = String(now.getMilliseconds()).padStart(3, '0');
        return `${YYYY}-${MM}-${DD} ${HH}:${mm}:${ss}.${ms}`;
    }

    private initLogFile(): boolean {
        try {
            const logDir = path.dirname(this.logFilePath);
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }

            this.writeStream = fs.createWriteStream(this.logFilePath, {
                encoding: 'utf-8',
                flags: 'a'
            });

            const header = `IPOP Session Log\nConnection: ${this.connection.name}\nHost: ${this.connection.host}:${this.connection.port}\nEncoding: ${this.connection.encoding}\nStartTime: ${this.formatTimestamp()}\n\n`;
            this.writeStream.write(header);
            return true;
        } catch (error) {
            console.error('Failed to init log file:', error);
            this.enabled = false;
            return false;
        }
    }

    logConnect(keepaliveInterval: number): void {
        if (!this.enabled) return;
        
        if (!this.writeStream) {
            if (!this.initLogFile()) return;
        }
        
        if (this.writeStream) {
            const line = `[${this.formatTimestamp()}] [${LogEventType.CONNECT}] ${this.connection.host}:${this.connection.port} ${this.connection.encoding} keepalive=${keepaliveInterval}ms\n`;
            this.writeStream.write(line);
        }
    }

    logDisconnect(reason?: string): void {
        if (!this.enabled) return;
        
        if (!this.writeStream) {
            if (!this.initLogFile()) return;
        }
        
        if (this.writeStream) {
            const line = `[${this.formatTimestamp()}] [${LogEventType.DISCONNECT}] ${reason || 'Unknown'}\n`;
            this.writeStream.write(line);
            this.close();
        }
    }

    logInput(data: string): void {
        if (!this.enabled) return;
        
        if (!this.writeStream) {
            if (!this.initLogFile()) return;
        }
        
        if (this.writeStream) {
            const line = `[${this.formatTimestamp()}] [${LogEventType.INPUT}] ${data}\n`;
            this.writeStream.write(line);
        }
    }

    logOutput(data: string): void {
        if (!this.enabled) return;
        
        if (!this.writeStream) {
            if (!this.initLogFile()) return;
        }
        
        if (this.writeStream) {
            const line = `[${this.formatTimestamp()}] [${LogEventType.OUTPUT}] ${data}\n`;
            this.writeStream.write(line);
        }
    }

    logError(error: Error): void {
        if (!this.enabled) return;
        
        if (!this.writeStream) {
            if (!this.initLogFile()) return;
        }
        
        if (this.writeStream) {
            const line = `[${this.formatTimestamp()}] [${LogEventType.ERROR}] ${error.message}\n`;
            this.writeStream.write(line);
        }
    }

    close(): void {
        if (this.writeStream) {
            this.writeStream.end();
            this.writeStream = null;
        }
    }

    getLogFilePath(): string {
        return this.logFilePath;
    }
}