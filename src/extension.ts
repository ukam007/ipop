import * as vscode from 'vscode';
import { initConfigStore } from './config/store';
import { initProviders } from './sidebar/provider';
import { registerCommands } from './commands';
import { registerCompletionCommands } from './completion/provider';
import { getSymbolIndexer } from './completion/indexer';

export function activate(context: vscode.ExtensionContext): void {
    initConfigStore(context);
    
    const providers = initProviders();

    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('ipop.connections', providers.connections),
        vscode.window.registerTreeDataProvider('ipop.shortcuts', providers.shortcuts),
        vscode.window.registerTreeDataProvider('ipop.completionSources', providers.completionSources),
        ...registerCommands(),
        ...registerCompletionCommands()
    );

    initSymbolIndexerInBackground();
}

async function initSymbolIndexerInBackground(): Promise<void> {
    try {
        const indexer = getSymbolIndexer();
        await indexer.indexAll();
        const stats = indexer.getStats();
        if (stats.totalSymbols > 0) {
            vscode.window.showInformationMessage(
                `IPOP Telnet: ${stats.totalSymbols} symbols indexed`
            );
        }
    } catch (error) {
        console.error('Symbol indexer error:', error);
    }
}

export function deactivate(): void {
    try {
        getSymbolIndexer().clear();
    } catch (error) {
        console.error('Deactivate error:', error);
    }
}