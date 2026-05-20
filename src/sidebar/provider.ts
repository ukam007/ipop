import * as vscode from 'vscode';
import { TelnetConnection, ShortcutCommand, CompletionSource } from '../types';
import { ConnectionTreeItem, ShortcutTreeItem, CompletionSourceTreeItem, InfoTreeItem } from './item';
import { getConfigStore } from '../config/store';
import { WebViewPanelRegistry } from '../webview/panel';

export class ConnectionsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
    onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(_element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        const connections = getConfigStore().getConnections();
        
        if (connections.length === 0) {
            return Promise.resolve([
                new InfoTreeItem('No connections', 'Click + to add')
            ]);
        }

        const registry = WebViewPanelRegistry.getInstance();
        const items = connections.map(conn => {
            const panel = registry.get(conn.id);
            const status = panel ? 'connected' : 'disconnected';
            return new ConnectionTreeItem(conn, status);
        });

        return Promise.resolve(items);
    }
}

export class ShortcutsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
    onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(_element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        const shortcuts = getConfigStore().getShortcuts();
        
        if (shortcuts.length === 0) {
            return Promise.resolve([
                new InfoTreeItem('No shortcuts', 'Click + to add')
            ]);
        }

        return Promise.resolve(shortcuts.map(s => new ShortcutTreeItem(s)));
    }
}

export class CompletionSourcesProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
    onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(_element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        const sources = getConfigStore().getCompletionSources();
        
        if (sources.length === 0) {
            return Promise.resolve([
                new InfoTreeItem('No sources', 'Click + to add')
            ]);
        }

        return Promise.resolve(sources.map(s => new CompletionSourceTreeItem(s)));
    }
}

let connectionsProvider: ConnectionsProvider | undefined;
let shortcutsProvider: ShortcutsProvider | undefined;
let completionSourcesProvider: CompletionSourcesProvider | undefined;

export function initProviders(): {
    connections: ConnectionsProvider;
    shortcuts: ShortcutsProvider;
    completionSources: CompletionSourcesProvider;
} {
    connectionsProvider = new ConnectionsProvider();
    shortcutsProvider = new ShortcutsProvider();
    completionSourcesProvider = new CompletionSourcesProvider();

    return {
        connections: connectionsProvider,
        shortcuts: shortcutsProvider,
        completionSources: completionSourcesProvider
    };
}

export function getConnectionsProvider(): ConnectionsProvider {
    if (!connectionsProvider) {
        throw new Error('ConnectionsProvider not initialized');
    }
    return connectionsProvider;
}

export function getShortcutsProvider(): ShortcutsProvider {
    if (!shortcutsProvider) {
        throw new Error('ShortcutsProvider not initialized');
    }
    return shortcutsProvider;
}

export function getCompletionSourcesProvider(): CompletionSourcesProvider {
    if (!completionSourcesProvider) {
        throw new Error('CompletionSourcesProvider not initialized');
    }
    return completionSourcesProvider;
}