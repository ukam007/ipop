import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { CompletionSource, SymbolInfo } from '../types';
import { getSymbolStore, createSymbolsFromCustom } from './symbols';
import { FuzzySearcher } from './fuzzy';
import { parseDirectory } from './parser';
import { getConfigStore } from '../config/store';

export class SymbolIndexer {
    private fuzzySearcher: FuzzySearcher;
    private indexedSources: Set<string> = new Set();
    private indexing: boolean = false;

    constructor() {
        this.fuzzySearcher = new FuzzySearcher();
    }

    async indexSource(source: CompletionSource): Promise<SymbolInfo[]> {
        if (this.indexedSources.has(source.id)) {
            return getSymbolStore().getSourceSymbols(source.id);
        }

        const symbols: SymbolInfo[] = [];

        if (source.type === 'workspace') {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders) {
                for (const folder of workspaceFolders) {
                    const symbolsFromFolder = parseDirectory(
                        folder.uri.fsPath,
                        source.id,
                        source.filePatterns || ['*.h', '*.hpp', '*.c', '*.cpp']
                    );
                    symbols.push(...symbolsFromFolder);
                }
            }
        } else if (source.type === 'external' && source.path) {
            if (fs.existsSync(source.path)) {
                const symbolsFromPath = parseDirectory(
                    source.path,
                    source.id,
                    source.filePatterns || ['*.h', '*.hpp', '*.c', '*.cpp']
                );
                symbols.push(...symbolsFromPath);
            }
        } else if (source.type === 'custom' && source.symbols) {
            symbols.push(...createSymbolsFromCustom(source));
        }

        getSymbolStore().addSymbols(symbols);
        this.indexedSources.add(source.id);
        this.updateFuzzyIndex();

        return symbols;
    }

    async indexAll(): Promise<void> {
        if (this.indexing) return;
        this.indexing = true;

        const sources = getConfigStore().getCompletionSources();
        
        for (const source of sources) {
            if (source.enabled) {
                await this.indexSource(source);
            }
        }

        this.indexing = false;
    }

    async refreshSource(sourceId: string): Promise<void> {
        const source = getConfigStore().getCompletionSource(sourceId);
        if (source) {
            this.removeSource(sourceId);
            await this.indexSource(source);
        }
    }

    removeSource(sourceId: string): void {
        this.indexedSources.delete(sourceId);
        getSymbolStore().removeSource(sourceId);
        this.updateFuzzyIndex();
    }

    search(query: string, maxResults?: number): SymbolInfo[] {
        const config = vscode.workspace.getConfiguration('ipop.completion');
        const max = maxResults || config.get<number>('maxResults', 20);
        
        const results = this.fuzzySearcher.search(query, max);
        return results.map(r => r.item);
    }

    private updateFuzzyIndex(): void {
        this.fuzzySearcher.updateIndex(getSymbolStore().getAllSymbols());
    }

    clear(): void {
        this.indexedSources.clear();
        getSymbolStore().clear();
        this.fuzzySearcher.clear();
    }

    isIndexed(sourceId: string): boolean {
        return this.indexedSources.has(sourceId);
    }

    getStats(): { indexedSources: number; totalSymbols: number } {
        return {
            indexedSources: this.indexedSources.size,
            totalSymbols: getSymbolStore().getStats().total
        };
    }
}

let indexer: SymbolIndexer | undefined;

export function getSymbolIndexer(): SymbolIndexer {
    if (!indexer) {
        indexer = new SymbolIndexer();
    }
    return indexer;
}

export async function initSymbolIndexer(): Promise<void> {
    const indexer = getSymbolIndexer();
    await indexer.indexAll();
}