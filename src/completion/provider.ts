import * as vscode from 'vscode';
import { SymbolInfo } from '../types';
import { getSymbolIndexer } from './indexer';

export class TerminalCompletionHelper {
    private lastQuery: string = '';

    async showCompletionPicker(query?: string): Promise<void> {
        const config = vscode.workspace.getConfiguration('ipop.completion');
        
        if (!config.get<boolean>('enableAutoComplete', true)) {
            vscode.window.showWarningMessage('Auto-completion is disabled in settings');
            return;
        }

        const indexer = getSymbolIndexer();
        const stats = indexer.getStats();
        
        if (stats.totalSymbols === 0) {
            vscode.window.showWarningMessage('No symbols indexed. Add completion sources first.');
            return;
        }

        const searchQuery = query || await vscode.window.showInputBox({
            prompt: 'Search symbols',
            placeHolder: 'Enter partial symbol name (e.g., "get", "init")',
            value: this.lastQuery
        });

        if (!searchQuery) return;
        
        this.lastQuery = searchQuery;

        const results = indexer.search(searchQuery);

        if (results.length === 0) {
            vscode.window.showInformationMessage(`No symbols matching "${searchQuery}"`);
            return;
        }

        const items = results.map(s => ({
            label: s.name,
            description: s.detail || '',
            detail: s.filePath ? `${s.filePath}:${s.line || 0}` : `Source: ${s.sourceId}`,
            symbol: s
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: `Found ${results.length} symbols. Select to insert.`,
            matchOnDescription: true,
            matchOnDetail: true
        });

        if (selected && vscode.window.activeTerminal) {
            vscode.window.activeTerminal.sendText(selected.symbol.insertText);
        }
    }

    searchSymbols(query: string): SymbolInfo[] {
        return getSymbolIndexer().search(query);
    }

    getStats(): { totalSymbols: number } {
        return getSymbolIndexer().getStats();
    }
}

let helper: TerminalCompletionHelper | undefined;

export function getCompletionHelper(): TerminalCompletionHelper {
    if (!helper) {
        helper = new TerminalCompletionHelper();
    }
    return helper;
}

export async function triggerCompletion(): Promise<void> {
    const terminals = vscode.window.terminals;
    
    if (terminals.length === 0) {
        vscode.window.showWarningMessage('No active terminal. Open a terminal first.');
        return;
    }

    await getCompletionHelper().showCompletionPicker();
}

export async function quickCompletion(): Promise<void> {
    const stats = getCompletionHelper().getStats();
    
    if (stats.totalSymbols === 0) {
        vscode.window.showWarningMessage('No symbols indexed. Add completion sources first.');
        return;
    }

    if (!vscode.window.activeTerminal) {
        vscode.window.showWarningMessage('No active terminal');
        return;
    }

    await getCompletionHelper().showCompletionPicker();
}

export function registerCompletionCommands(): vscode.Disposable[] {
    return [
        vscode.commands.registerCommand('ipop.completion.trigger', triggerCompletion),
        vscode.commands.registerCommand('ipop.completion.quick', quickCompletion)
    ];
}