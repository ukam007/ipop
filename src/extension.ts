import * as vscode from 'vscode';
import { initConfigStore } from './config/store';
import { initProviders } from './sidebar/provider';
import { registerCommands } from './commands';
import { registerCompletionProvider, registerCompletionCommands } from './completion/provider';
import { initHistory } from './completion/history';
import { getSymbolIndexer } from './completion/indexer';
import { LogsViewProvider } from './logger';

export function activate(context: vscode.ExtensionContext): void {
    initConfigStore(context);
    initHistory(context);
    
    const providers = initProviders();
    
    const logsProvider = new LogsViewProvider();

    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('ipop.connections', providers.connections),
        vscode.window.registerTreeDataProvider('ipop.shortcuts', providers.shortcuts),
        vscode.window.registerTreeDataProvider('ipop.completionSources', providers.completionSources),
        vscode.window.registerTreeDataProvider('ipop.logs', logsProvider),
        registerCompletionProvider(),
        ...registerCommands(),
        ...registerCompletionCommands(),
        ...registerLogCommands(logsProvider)
    );

    initSymbolIndexerInBackground();
}

function registerLogCommands(logsProvider: LogsViewProvider): vscode.Disposable[] {
    const fileManager = logsProvider.getFileManager();

    return [
        vscode.commands.registerCommand('ipop.logs.open', (filePath: string) => {
            fileManager.openLogFile(filePath);
        }),
        vscode.commands.registerCommand('ipop.logs.openDir', () => {
            fileManager.openLogDir();
        }),
        vscode.commands.registerCommand('ipop.logs.delete', (filePath: string) => {
            fileManager.deleteLogFile(filePath);
            logsProvider.refresh();
            vscode.window.showInformationMessage('Log file deleted');
        }),
        vscode.commands.registerCommand('ipop.logs.cleanup', () => {
            fileManager.cleanupOldLogs();
            logsProvider.refresh();
            vscode.window.showInformationMessage('Old logs cleaned up');
        }),
        vscode.commands.registerCommand('ipop.logs.refresh', () => {
            logsProvider.refresh();
        })
    ];
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