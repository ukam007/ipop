import * as vscode from 'vscode';
import { TelnetConnection, ShortcutCommand, CompletionSource, ConnectionStatus } from '../types';

export class ConnectionTreeItem extends vscode.TreeItem {
    constructor(
        public readonly connection: TelnetConnection,
        public readonly status: ConnectionStatus
    ) {
        super(connection.name, vscode.TreeItemCollapsibleState.None);
        
        this.description = `${connection.host}:${connection.port}`;
        this.tooltip = `${connection.name}\n${connection.host}:${connection.port}\nEncoding: ${connection.encoding}`;
        
        if (status === 'connected') {
            this.iconPath = new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('editorGutter.fgGreen'));
            this.contextValue = 'connection-connected';
        } else if (status === 'connecting') {
            this.iconPath = new vscode.ThemeIcon('sync~spin', new vscode.ThemeColor('editorGutter.fgYellow'));
            this.contextValue = 'connection-connecting';
        } else {
            this.iconPath = new vscode.ThemeIcon('circle-outline', new vscode.ThemeColor('disabledForeground'));
            this.contextValue = 'connection-disconnected';
        }
    }
}

export class ShortcutTreeItem extends vscode.TreeItem {
    constructor(public readonly shortcut: ShortcutCommand) {
        super(shortcut.name, vscode.TreeItemCollapsibleState.None);
        
        this.description = shortcut.command;
        this.tooltip = `${shortcut.name}\n${shortcut.command}\n${shortcut.description || ''}`;
        this.iconPath = new vscode.ThemeIcon('terminal', new vscode.ThemeColor('terminal.ansiBlue'));
        this.contextValue = 'shortcut';
    }
}

export class CompletionSourceTreeItem extends vscode.TreeItem {
    constructor(public readonly source: CompletionSource) {
        super(source.name, vscode.TreeItemCollapsibleState.None);
        
        let description = '';
        if (source.type === 'workspace') {
            description = 'Workspace';
        } else if (source.type === 'external') {
            description = source.path || '';
        } else {
            description = `Custom (${source.symbols?.length || 0} symbols)`;
        }
        
        this.description = description;
        this.tooltip = `${source.name}\nType: ${source.type}\n${source.path || ''}`;
        this.iconPath = source.enabled 
            ? new vscode.ThemeIcon('check', new vscode.ThemeColor('editorGutter.fgGreen'))
            : new vscode.ThemeIcon('circle-slash', new vscode.ThemeColor('disabledForeground'));
        this.contextValue = 'completion-source';
    }
}

export class InfoTreeItem extends vscode.TreeItem {
    constructor(label: string, description?: string) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.description = description;
        this.iconPath = new vscode.ThemeIcon('info');
        this.contextValue = 'info';
    }
}