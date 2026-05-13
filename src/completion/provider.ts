import * as vscode from 'vscode';
import { SymbolInfo, SYMBOL_KIND_TO_VSCODE } from '../types';
import { getSymbolIndexer } from './indexer';

export class TerminalCompletionHelper {
    async showCompletionPicker(query: string): Promise<void> {
        const config = vscode.workspace.getConfiguration('ipop.completion');
        
        if (!config.get<boolean>('enableAutoComplete', true)) {
            return;
        }

        const indexer = getSymbolIndexer();
        const results = indexer.search(query);

        if (results.length === 0) {
            vscode.window.showInformationMessage('No matching symbols found');
            return;
        }

        const items = results.map(s => ({
            label: s.name,
            description: s.detail || '',
            detail: s.filePath ? `${s.filePath}:${s.line || 0}` : '',
            symbol: s
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select symbol to insert',
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
        vscode.window.showWarningMessage('No active terminal');
        return;
    }

    const query = await vscode.window.showInputBox({
        prompt: 'Search symbols',
        placeHolder: 'Enter partial symbol name'
    });

    if (!query) return;

    await getCompletionHelper().showCompletionPicker(query);
}

export function registerCompletionCommands(): vscode.Disposable[] {
    return [
        vscode.commands.registerCommand('ipop.completion.trigger', triggerCompletion)
    ];
}