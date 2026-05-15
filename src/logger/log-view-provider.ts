import * as vscode from 'vscode';
import { LogFileManager, LogFileInfo } from './file-manager';
import { LogTreeItem, LogInfoItem } from './log-item';

export class LogsViewProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
    onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private fileManager: LogFileManager;

    constructor() {
        this.fileManager = new LogFileManager();
    }

    refresh(): void {
        this.fileManager.cleanupOldLogs();
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(_element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        const files = this.fileManager.getLogFiles();
        
        if (files.length === 0) {
            return Promise.resolve([
                new LogInfoItem('No logs', 'Sessions will be logged automatically')
            ]);
        }

        const items = files.map(file => new LogTreeItem(file));
        return Promise.resolve(items);
    }

    getFileManager(): LogFileManager {
        return this.fileManager;
    }
}