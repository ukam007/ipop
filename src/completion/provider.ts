import * as vscode from 'vscode';
import { SymbolInfo, SYMBOL_KIND_TO_VSCODE } from '../types';
import { getSymbolIndexer } from './indexer';
import { 
    isIPOPTerminal, 
    getActiveIPOPTerminal, 
    shouldTriggerCompletion,
    getMinTriggerChars,
    isAutoCompletionEnabled,
    isTabCompletionEnabled
} from './terminal-filter';

export class IPOPCompletionProvider {
    async provideTerminalCompletionItems(
        context: { terminal: vscode.Terminal; commandLine: { text: string } },
        token: vscode.CancellationToken
    ): Promise<vscode.CompletionItem[] | undefined> {
        if (!isAutoCompletionEnabled()) {
            return undefined;
        }
        
        if (!shouldTriggerCompletion(context.terminal)) {
            return undefined;
        }
        
        const indexer = getSymbolIndexer();
        const stats = indexer.getStats();
        
        if (stats.totalSymbols === 0) {
            return undefined;
        }
        
        const inputText = context.commandLine.text.trim();
        const minChars = getMinTriggerChars();
        
        if (inputText.length < minChars) {
            return undefined;
        }
        
        if (token.isCancellationRequested) {
            return undefined;
        }
        
        const results = indexer.search(inputText);
        
        if (results.length === 0) {
            return undefined;
        }
        
        const config = vscode.workspace.getConfiguration('ipop.completion');
        const maxResults = config.get<number>('maxResults', 20);
        const limitedResults = results.slice(0, maxResults);
        
        return limitedResults.map(symbol => this.createCompletionItem(symbol));
    }
    
    private createCompletionItem(symbol: SymbolInfo): vscode.CompletionItem {
        const item = new vscode.CompletionItem(symbol.name);
        item.kind = SYMBOL_KIND_TO_VSCODE[symbol.kind] || vscode.CompletionItemKind.Function;
        item.detail = symbol.detail || '';
        item.documentation = symbol.filePath 
            ? `${symbol.filePath}:${symbol.line || 0}` 
            : undefined;
        item.insertText = symbol.insertText;
        return item;
    }
}

export class TabCompletionHelper {
    private lastQuery: string = '';
    
    async showCompletionPicker(query: string): Promise<string | undefined> {
        const indexer = getSymbolIndexer();
        const stats = indexer.getStats();
        
        if (stats.totalSymbols === 0) {
            vscode.window.showWarningMessage('No symbols indexed. Add completion sources first.');
            return undefined;
        }
        
        this.lastQuery = query;
        
        const results = indexer.search(query);
        
        if (results.length === 0) {
            vscode.window.showInformationMessage(`No symbols matching "${query}"`);
            return undefined;
        }
        
        const items = results.map(s => ({
            label: s.name,
            description: s.detail || '',
            detail: s.filePath ? `${s.filePath}:${s.line || 0}` : `Source: ${s.sourceId}`,
            symbol: s
        }));
        
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: `Tab Completion: ${results.length} matches for "${query}"`,
            matchOnDescription: true,
            matchOnDetail: true
        });
        
        if (selected) {
            return selected.symbol.insertText;
        }
        
        return undefined;
    }
    
    getStats(): { totalSymbols: number } {
        return getSymbolIndexer().getStats();
    }
}

let completionProvider: IPOPCompletionProvider | undefined;
let tabHelper: TabCompletionHelper | undefined;

export function getCompletionProvider(): IPOPCompletionProvider {
    if (!completionProvider) {
        completionProvider = new IPOPCompletionProvider();
    }
    return completionProvider;
}

export function getTabHelper(): TabCompletionHelper {
    if (!tabHelper) {
        tabHelper = new TabCompletionHelper();
    }
    return tabHelper;
}

export async function triggerCompletion(): Promise<void> {
    if (!isTabCompletionEnabled()) {
        vscode.window.showWarningMessage('Tab completion is disabled in settings');
        return;
    }
    
    const stats = getTabHelper().getStats();
    
    if (stats.totalSymbols === 0) {
        vscode.window.showWarningMessage('No symbols indexed. Add completion sources first.');
        return;
    }
    
    const activeTerminal = getActiveIPOPTerminal();
    
    if (!activeTerminal) {
        vscode.window.showWarningMessage('No active IPOP terminal');
        return;
    }
    
    activeTerminal.show();
    
    const query = await vscode.window.showInputBox({
        prompt: 'Search symbols for completion',
        placeHolder: 'Enter partial symbol name (e.g., "get", "init")',
        value: ''
    });
    
    if (!query) return;
    
    const insertText = await getTabHelper().showCompletionPicker(query);
    
    if (insertText && activeTerminal) {
        activeTerminal.sendText(insertText);
    }
}

export async function quickCompletion(query?: string): Promise<string | undefined> {
    if (!isTabCompletionEnabled()) {
        return undefined;
    }
    
    const stats = getTabHelper().getStats();
    
    if (stats.totalSymbols === 0) {
        return undefined;
    }
    
    if (query && query.length >= getMinTriggerChars()) {
        return await getTabHelper().showCompletionPicker(query);
    }
    
    return undefined;
}

export function registerCompletionProvider(): vscode.Disposable {
    const provider = getCompletionProvider();
    
    try {
        const vscodeWindow = vscode.window as any;
        if (vscodeWindow.registerTerminalCompletionItemProvider) {
            return vscodeWindow.registerTerminalCompletionItemProvider('ipop', {
                provideTerminalCompletionItems: (context: any, token: vscode.CancellationToken) => {
                    return provider.provideTerminalCompletionItems(context, token);
                }
            });
        }
    } catch (e) {
        console.log('TerminalCompletionItemProvider not available, using fallback');
    }
    
    return new vscode.Disposable(() => {});
}

export function registerCompletionCommands(): vscode.Disposable[] {
    return [
        vscode.commands.registerCommand('ipop.completion.trigger', triggerCompletion),
        vscode.commands.registerCommand('ipop.completion.quick', 
            (query?: string) => quickCompletion(query))
    ];
}