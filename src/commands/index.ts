import * as vscode from 'vscode';
import { TelnetConnection, CompletionSource, Encoding, CompletionSourceType } from '../types';
import { getConfigStore } from '../config/store';
import { getConnectionsProvider, getCompletionSourcesProvider } from '../sidebar/provider';
import { getTerminalRegistry } from '../terminal/manager';
import { getSymbolIndexer } from '../completion/indexer';
import { ConnectionTreeItem, CompletionSourceTreeItem, ShortcutTreeItem } from '../sidebar/item';
import { addShortcut, deleteShortcut, sendShortcut } from './shortcuts';

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export async function newConnection(): Promise<void> {
    const config = vscode.workspace.getConfiguration('ipop.telnet');
    const defaultPort = config.get<number>('defaultPort', 23);
    const defaultEncoding = config.get<Encoding>('defaultEncoding', 'utf-8');

    const name = await vscode.window.showInputBox({
        prompt: 'Connection name',
        placeHolder: 'Enter connection name'
    });
    if (!name) return;

    const host = await vscode.window.showInputBox({
        prompt: 'Host address',
        placeHolder: 'Enter IP or hostname'
    });
    if (!host) return;

    const portStr = await vscode.window.showInputBox({
        prompt: 'Port',
        placeHolder: 'Enter port number',
        value: defaultPort.toString()
    });
    if (!portStr) return;
    const port = parseInt(portStr, 10);
    if (isNaN(port)) {
        vscode.window.showErrorMessage('Invalid port number');
        return;
    }

    const encodingPick = await vscode.window.showQuickPick(
        ['utf-8', 'gbk', 'gb2312', 'big5'],
        { placeHolder: 'Select encoding' }
    );
    if (!encodingPick) return;

    const connection: TelnetConnection = {
        id: generateId(),
        name,
        host,
        port,
        encoding: encodingPick as Encoding
    };

    await getConfigStore().addConnection(connection);
    getConnectionsProvider().refresh();
    vscode.window.showInformationMessage(`Connection "${name}" added`);
}

export async function connect(item: ConnectionTreeItem): Promise<void> {
    const connection = item.connection;
    const terminal = getTerminalRegistry().create(connection);
    terminal.show();
    getConnectionsProvider().refresh();
}

export async function disconnect(item: ConnectionTreeItem): Promise<void> {
    const connection = item.connection;
    const manager = getTerminalRegistry().get(connection.id);
    
    if (manager) {
        manager.disconnect();
        manager.getTerminal()?.dispose();
        getTerminalRegistry().delete(connection.id);
    }
    
    getConnectionsProvider().refresh();
    vscode.window.showInformationMessage(`Disconnected from "${connection.name}"`);
}

export async function editConnection(item: ConnectionTreeItem): Promise<void> {
    const connection = item.connection;

    const name = await vscode.window.showInputBox({
        prompt: 'Connection name',
        value: connection.name
    });
    if (!name) return;

    const host = await vscode.window.showInputBox({
        prompt: 'Host address',
        value: connection.host
    });
    if (!host) return;

    const portStr = await vscode.window.showInputBox({
        prompt: 'Port',
        value: connection.port.toString()
    });
    if (!portStr) return;
    const port = parseInt(portStr, 10);

    const encodingPick = await vscode.window.showQuickPick(
        ['utf-8', 'gbk', 'gb2312', 'big5'],
        { placeHolder: 'Select encoding' }
    );
    if (!encodingPick) return;

    const updated: TelnetConnection = {
        ...connection,
        name,
        host,
        port,
        encoding: encodingPick as Encoding
    };

    await getConfigStore().updateConnection(updated);
    getConnectionsProvider().refresh();
}

export async function deleteConnection(item: ConnectionTreeItem): Promise<void> {
    const connection = item.connection;
    
    const confirm = await vscode.window.showWarningMessage(
        `Delete connection "${connection.name}"?`,
        'Yes', 'No'
    );
    
    if (confirm !== 'Yes') return;

    disconnect(item);
    await getConfigStore().deleteConnection(connection.id);
    getConnectionsProvider().refresh();
}

export async function addCompletionSource(): Promise<void> {
    const typePick = await vscode.window.showQuickPick(
        ['workspace', 'external', 'custom'],
        {
            placeHolder: 'Select source type',
            matchOnDescription: true
        }
    );
    if (!typePick) return;

    const name = await vscode.window.showInputBox({
        prompt: 'Source name',
        placeHolder: 'Enter source name'
    });
    if (!name) return;

    const source: CompletionSource = {
        id: generateId(),
        name,
        type: typePick as CompletionSourceType,
        enabled: true
    };

    if (typePick === 'external') {
        const path = await vscode.window.showInputBox({
            prompt: 'Directory path',
            placeHolder: 'Enter absolute path to code directory'
        });
        if (!path) return;
        source.path = path;
    }

    if (typePick === 'custom') {
        source.symbols = [];
    }

    await getConfigStore().addCompletionSource(source);
    getCompletionSourcesProvider().refresh();

    if (typePick === 'workspace' || typePick === 'external') {
        await getSymbolIndexer().indexSource(source);
        vscode.window.showInformationMessage(
            `Source "${name}" indexed (${getSymbolIndexer().getStats().totalSymbols} symbols)`
        );
    } else {
        vscode.window.showInformationMessage(`Source "${name}" added. Add symbols via context menu.`);
    }
}

export async function editCompletionSource(item: CompletionSourceTreeItem): Promise<void> {
    const source = item.source;

    const name = await vscode.window.showInputBox({
        prompt: 'Source name',
        value: source.name
    });
    if (!name) return;

    const enabled = await vscode.window.showQuickPick(
        ['Enabled', 'Disabled'],
        { placeHolder: 'Enable this source?' }
    );

    const updated: CompletionSource = {
        ...source,
        name,
        enabled: enabled === 'Enabled'
    };

    if (source.type === 'external') {
        const path = await vscode.window.showInputBox({
            prompt: 'Directory path',
            value: source.path || ''
        });
        if (path) updated.path = path;
    }

    await getConfigStore().updateCompletionSource(updated);
    getCompletionSourcesProvider().refresh();
}

export async function removeCompletionSource(item: CompletionSourceTreeItem): Promise<void> {
    const source = item.source;
    
    const confirm = await vscode.window.showWarningMessage(
        `Remove source "${source.name}"?`,
        'Yes', 'No'
    );
    
    if (confirm !== 'Yes') return;

    try {
        getSymbolIndexer().removeSource(source.id);
        await getConfigStore().deleteCompletionSource(source.id);
        getCompletionSourcesProvider().refresh();
        vscode.window.showInformationMessage(`Source "${source.name}" removed`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to remove source: ${error}`);
    }
}

export async function refreshIndex(item: CompletionSourceTreeItem): Promise<void> {
    const source = item.source;
    
    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: `Indexing ${source.name}...`,
            cancellable: false
        },
        async () => {
            await getSymbolIndexer().refreshSource(source.id);
        }
    );

    const symbols = getSymbolIndexer().getStats().totalSymbols;
    vscode.window.showInformationMessage(`${source.name}: ${symbols} symbols indexed`);
}

export async function addCustomSymbol(item: CompletionSourceTreeItem): Promise<void> {
    const source = item.source;
    
    if (source.type !== 'custom') {
        vscode.window.showWarningMessage('Only custom sources support manual symbols');
        return;
    }

    const name = await vscode.window.showInputBox({
        prompt: 'Symbol name',
        placeHolder: 'Enter function/command name'
    });
    if (!name) return;

    const insertText = await vscode.window.showInputBox({
        prompt: 'Insert text',
        placeHolder: 'Enter text to insert',
        value: name
    });
    if (!insertText) return;

    const detail = await vscode.window.showInputBox({
        prompt: 'Detail (optional)',
        placeHolder: 'Enter description'
    });

    source.symbols = source.symbols || [];
    source.symbols.push({
        name,
        kind: 'command',
        insertText,
        detail
    });

    await getConfigStore().updateCompletionSource(source);
    await getSymbolIndexer().refreshSource(source.id);
    getCompletionSourcesProvider().refresh();
}

export function registerCommands(): vscode.Disposable[] {
    return [
        vscode.commands.registerCommand('ipop.newConnection', newConnection),
        vscode.commands.registerCommand('ipop.connect', connect),
        vscode.commands.registerCommand('ipop.disconnect', disconnect),
        vscode.commands.registerCommand('ipop.editConnection', editConnection),
        vscode.commands.registerCommand('ipop.deleteConnection', deleteConnection),
        
        vscode.commands.registerCommand('ipop.addShortcut', addShortcut),
        vscode.commands.registerCommand('ipop.deleteShortcut', 
            (item: ShortcutTreeItem) => deleteShortcut(item.shortcut)),
        vscode.commands.registerCommand('ipop.sendShortcut',
            (item: ShortcutTreeItem) => sendShortcut(item.shortcut)),
        
        vscode.commands.registerCommand('ipop.completion.addSource', addCompletionSource),
        vscode.commands.registerCommand('ipop.completion.editSource', editCompletionSource),
        vscode.commands.registerCommand('ipop.completion.removeSource', removeCompletionSource),
        vscode.commands.registerCommand('ipop.completion.refreshIndex', refreshIndex),
        vscode.commands.registerCommand('ipop.completion.addCustomSymbol', addCustomSymbol)
    ];
}