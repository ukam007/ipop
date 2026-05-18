import * as vscode from 'vscode';
import { SymbolInfo, FuzzyMatchResult, SYMBOL_KIND_TO_VSCODE } from '../types';
import { getSymbolIndexer } from './indexer';
import { getHistory } from './history';
import { 
    isIPOPTerminal, 
    getActiveIPOPTerminal, 
    shouldTriggerCompletion,
    getMinTriggerChars,
    isAutoCompletionEnabled,
    isTabCompletionEnabled
} from './terminal-filter';

const kindIcons: Record<string, string> = {
    'function': 'ƒ',
    'class': 'c',
    'method': 'm',
    'variable': 'v',
    'macro': '#',
    'typedef': 't',
    'command': '>'
};

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
        
        const history = getHistory();
        const historyMatches = history.searchHistory(inputText, 5);
        
        const results = indexer.searchFuzzy(inputText);
        
        if (results.length === 0 && historyMatches.length === 0) {
            return undefined;
        }
        
        const items: vscode.CompletionItem[] = [];
        
        for (const histCmd of historyMatches) {
            const freq = history.getFrequency(histCmd);
            const item = new vscode.CompletionItem(histCmd);
            item.kind = vscode.CompletionItemKind.Text;
            item.detail = `★ Used ${freq} times`;
            item.insertText = histCmd;
            item.sortText = `0${freq.toString().padStart(5, '0')}`;
            items.push(item);
        }
        
        const config = vscode.workspace.getConfiguration('ipop.completion');
        const maxResults = config.get<number>('maxResults', 20);
        const limitedResults = results.slice(0, maxResults - historyMatches.length);
        
        for (const r of limitedResults) {
            const freq = history.getFrequency(r.item.insertText);
            const item = this.createCompletionItem(r.item, freq);
            item.sortText = `1${freq.toString().padStart(5, '0')}`;
            items.push(item);
        }
        
        return items;
    }
    
    private createCompletionItem(symbol: SymbolInfo, frequency: number = 0): vscode.CompletionItem {
        const item = new vscode.CompletionItem(symbol.name);
        item.kind = SYMBOL_KIND_TO_VSCODE[symbol.kind] || vscode.CompletionItemKind.Function;
        item.detail = frequency > 0 
            ? `${symbol.detail || ''} (★${frequency})` 
            : symbol.detail || '';
        item.documentation = symbol.filePath 
            ? `${symbol.filePath}:${symbol.line || 0}` 
            : undefined;
        item.insertText = symbol.insertText;
        return item;
    }
}

export class TabCompletionHelper {
    private lastQuery: string = '';
    private currentIndex: number = 0;
    private cachedResults: FuzzyMatchResult[] = [];
    
    quickSearch(query: string): number {
        const indexer = getSymbolIndexer();
        const stats = indexer.getStats();
        const history = getHistory();
        
        const historyMatches = history.searchHistory(query, 5);
        const symbolResults = stats.totalSymbols > 0 ? indexer.searchFuzzy(query) : [];
        
        return historyMatches.length + symbolResults.length;
    }
    
    getPreviewMatch(query: string): string | null {
        const history = getHistory();
        const historyMatches = history.searchHistory(query, 1);
        
        if (historyMatches.length > 0) {
            return `★ ${historyMatches[0]}`;
        }
        
        const indexer = getSymbolIndexer();
        const stats = indexer.getStats();
        
        if (stats.totalSymbols === 0) {
            return null;
        }
        
        const results = indexer.searchFuzzy(query, 1);
        if (results.length > 0) {
            return results[0].item.name;
        }
        
        return null;
    }
    
    getInlineMatches(query: string): string[] {
        const history = getHistory();
        const indexer = getSymbolIndexer();
        
        const historyMatches = history.searchHistory(query, 3);
        const symbolResults = indexer.searchFuzzy(query, 7);
        
        const all: string[] = [];
        
        for (const h of historyMatches) {
            all.push(h);
        }
        
        for (const r of symbolResults) {
            if (!all.includes(r.item.insertText)) {
                all.push(r.item.insertText);
            }
        }
        
        return all;
    }
    
    cycleInlineCompletion(query: string, forward: boolean = true): string | null {
        const matches = this.getInlineMatches(query);
        
        if (matches.length === 0) {
            return null;
        }
        
        if (this.lastQuery !== query) {
            this.lastQuery = query;
            this.currentIndex = 0;
        } else {
            if (forward) {
                this.currentIndex = (this.currentIndex + 1) % matches.length;
            } else {
                this.currentIndex = (this.currentIndex - 1 + matches.length) % matches.length;
            }
        }
        
        return matches[this.currentIndex];
    }
    
    async showCompletionPicker(query: string): Promise<string | undefined> {
        const indexer = getSymbolIndexer();
        const history = getHistory();
        const stats = indexer.getStats();
        
        this.lastQuery = query;
        
        const historyMatches = history.searchHistory(query, 5);
        const results = stats.totalSymbols > 0 ? indexer.searchFuzzy(query) : [];
        
        if (historyMatches.length === 0 && results.length === 0) {
            vscode.window.showInformationMessage(`No matches for "${query}"`);
            return undefined;
        }
        
        const items: vscode.QuickPickItem[] = [];
        
        for (const cmd of historyMatches) {
            const freq = history.getFrequency(cmd);
            items.push({
                label: `★ ${cmd}`,
                description: `History`,
                detail: `Used ${freq} times`
            });
        }
        
        for (const r of results) {
            const freq = history.getFrequency(r.item.insertText);
            const freqText = freq > 0 ? ` ★${freq}` : '';
            items.push({
                label: `${kindIcons[r.item.kind] || '?'} ${r.item.name}${freqText}`,
                description: r.item.detail || '',
                detail: r.item.filePath ? `${r.item.filePath}:${r.item.line || 0}` : `Source: ${r.item.sourceId}`
            });
        }
        
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: `${items.length} matches for "${query}" - Press Enter to select`,
            matchOnDescription: true,
            matchOnDetail: true
        });
        
        if (selected) {
            const text = selected.label.replace(/^[★ƒcvm#t>?] /, '').replace(/ ★\d+$/, '');
            return text;
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