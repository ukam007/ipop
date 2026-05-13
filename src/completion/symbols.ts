import * as vscode from 'vscode';
import { SymbolInfo, CustomSymbol, CompletionSource } from '../types';

export class SymbolStore {
    private symbols: Map<string, SymbolInfo> = new Map();
    private sourceSymbols: Map<string, Set<string>> = new Map();

    addSymbols(symbols: SymbolInfo[]): void {
        for (const symbol of symbols) {
            this.symbols.set(symbol.id, symbol);
            
            if (!this.sourceSymbols.has(symbol.sourceId)) {
                this.sourceSymbols.set(symbol.sourceId, new Set());
            }
            this.sourceSymbols.get(symbol.sourceId)?.add(symbol.id);
        }
    }

    removeSource(sourceId: string): void {
        const symbolIds = this.sourceSymbols.get(sourceId);
        if (symbolIds) {
            for (const id of symbolIds) {
                this.symbols.delete(id);
            }
            this.sourceSymbols.delete(sourceId);
        }
    }

    getSymbol(id: string): SymbolInfo | undefined {
        return this.symbols.get(id);
    }

    getAllSymbols(): SymbolInfo[] {
        return Array.from(this.symbols.values());
    }

    getSourceSymbols(sourceId: string): SymbolInfo[] {
        const ids = this.sourceSymbols.get(sourceId);
        if (!ids) return [];
        
        return Array.from(ids).map(id => this.symbols.get(id)).filter((s): s is SymbolInfo => s !== undefined);
    }

    search(query: string): SymbolInfo[] {
        const lowerQuery = query.toLowerCase();
        return this.getAllSymbols().filter(s => 
            s.name.toLowerCase().includes(lowerQuery)
        );
    }

    clear(): void {
        this.symbols.clear();
        this.sourceSymbols.clear();
    }

    getStats(): { total: number; sources: number } {
        return {
            total: this.symbols.size,
            sources: this.sourceSymbols.size
        };
    }
}

export function createSymbolsFromCustom(
    source: CompletionSource
): SymbolInfo[] {
    if (!source.symbols) return [];

    return source.symbols.map((s: CustomSymbol, index: number) => ({
        id: `${source.id}:custom:${s.name}:${index}`,
        name: s.name,
        kind: s.kind,
        detail: s.detail,
        insertText: s.insertText,
        sourceId: source.id
    }));
}

let store: SymbolStore | undefined;

export function getSymbolStore(): SymbolStore {
    if (!store) {
        store = new SymbolStore();
    }
    return store;
}