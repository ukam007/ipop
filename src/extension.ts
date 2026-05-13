import * as vscode from 'vscode';
import { initConfigStore } from './config/store';
import { initProviders, getConnectionsProvider, getShortcutsProvider, getCompletionSourcesProvider } from './sidebar/provider';
import { registerCommands } from './commands';
import { registerCompletionCommands } from './completion/provider';
import { initSymbolIndexer, getSymbolIndexer } from './completion/indexer';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    initConfigStore(context);
    
    const providers = initProviders();

    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('ipop.connections', providers.connections),
        vscode.window.registerTreeDataProvider('ipop.shortcuts', providers.shortcuts),
        vscode.window.registerTreeDataProvider('ipop.completionSources', providers.completionSources),
        ...registerCommands(),
        ...registerCompletionCommands()
    );

    await initSymbolIndexer();

    const stats = getSymbolIndexer().getStats();
    vscode.window.showInformationMessage(
        `IPOP Telnet activated: ${stats.totalSymbols} symbols indexed`
    );
}

export function deactivate(): void {
    getSymbolIndexer().clear();
}