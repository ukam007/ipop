import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export interface LogFileInfo {
    name: string;
    path: string;
    size: number;
    created: Date;
    modified: Date;
}

export class LogFileManager {
    private logDir: string;
    private maxFiles: number;
    private maxAge: number;
    private maxSize: number;

    constructor() {
        const config = vscode.workspace.getConfiguration('ipop.logging');
        const configPath = config.get<string>('path', '');
        this.logDir = configPath || this.getDefaultLogDir();
        this.maxFiles = config.get<number>('maxFiles', 50);
        this.maxAge = config.get<number>('maxAge', 7);
        this.maxSize = config.get<number>('maxSize', 10);
    }

    private getDefaultLogDir(): string {
        const appData = process.env.APPDATA || 
                        (process.platform === 'darwin' 
                            ? path.join(process.env.HOME || '', 'Library', 'Application Support')
                            : path.join(process.env.HOME || '', '.config'));
        return path.join(appData, 'ipop', 'logs');
    }

    private ensureLogDir(): void {
        try {
            if (!fs.existsSync(this.logDir)) {
                fs.mkdirSync(this.logDir, { recursive: true });
            }
        } catch (error) {
            console.error('Failed to create log directory:', error);
        }
    }

    getLogDir(): string {
        return this.logDir;
    }

    getLogFiles(): LogFileInfo[] {
        try {
            if (!fs.existsSync(this.logDir)) {
                this.ensureLogDir();
                return [];
            }

            const files = fs.readdirSync(this.logDir)
                .filter(f => f.endsWith('.log'))
                .map(f => {
                    const filePath = path.join(this.logDir, f);
                    const stats = fs.statSync(filePath);
                    return {
                        name: f,
                        path: filePath,
                        size: stats.size,
                        created: stats.birthtime,
                        modified: stats.mtime
                    };
                })
                .sort((a, b) => b.modified.getTime() - a.modified.getTime());
            
            return files;
        } catch (error) {
            console.error('Failed to read log files:', error);
            return [];
        }
    }

    cleanupOldLogs(): void {
        try {
            const files = this.getLogFiles();
            const now = Date.now();
            const maxAgeMs = this.maxAge * 24 * 60 * 60 * 1000;
            const maxSizeBytes = this.maxSize * 1024 * 1024;

            let deletedCount = 0;

            for (const file of files) {
                const ageMs = now - file.created.getTime();
                if (ageMs > maxAgeMs) {
                    fs.unlinkSync(file.path);
                    deletedCount++;
                }
            }

            const remainingFiles = this.getLogFiles();
            if (remainingFiles.length > this.maxFiles) {
                const toDelete = remainingFiles.slice(this.maxFiles);
                for (const file of toDelete) {
                    fs.unlinkSync(file.path);
                    deletedCount++;
                }
            }

            for (const file of this.getLogFiles()) {
                if (file.size > maxSizeBytes) {
                    fs.unlinkSync(file.path);
                    deletedCount++;
                }
            }

            if (deletedCount > 0) {
                console.log(`Cleaned up ${deletedCount} old log files`);
            }
        } catch (error) {
            console.error('Failed to cleanup old logs:', error);
        }
    }

    deleteLogFile(filePath: string): void {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            console.error('Failed to delete log file:', error);
        }
    }

    openLogFile(filePath: string): void {
        vscode.workspace.openTextDocument(filePath).then(doc => {
            vscode.window.showTextDocument(doc);
        });
    }

    openLogDir(): void {
        vscode.env.openExternal(vscode.Uri.file(this.logDir));
    }
}