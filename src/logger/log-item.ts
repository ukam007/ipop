import * as vscode from 'vscode';
import { LogFileInfo } from './file-manager';

export class LogTreeItem extends vscode.TreeItem {
    constructor(public readonly fileInfo: LogFileInfo) {
        super(fileInfo.name, vscode.TreeItemCollapsibleState.None);
        
        const sizeKB = Math.round(fileInfo.size / 1024);
        const dateStr = fileInfo.modified.toLocaleDateString();
        this.description = `${sizeKB}KB - ${dateStr}`;
        
        this.tooltip = `${fileInfo.name}\nSize: ${sizeKB}KB\nCreated: ${fileInfo.created.toLocaleString()}\nModified: ${fileInfo.modified.toLocaleString()}`;
        
        this.iconPath = new vscode.ThemeIcon('file-text');
        this.contextValue = 'log-file';
        
        this.command = {
            command: 'ipop.logs.open',
            title: 'Open Log',
            arguments: [fileInfo.path]
        };
    }
}

export class LogInfoItem extends vscode.TreeItem {
    constructor(label: string, description?: string) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.description = description;
        this.iconPath = new vscode.ThemeIcon('info');
        this.contextValue = 'log-info';
    }
}