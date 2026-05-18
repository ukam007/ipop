import Fuse from 'fuse.js';
import { SymbolInfo, FuzzyMatchResult } from '../types';

interface SymbolWithFrequency extends SymbolInfo {
    frequency?: number;
}

export class FuzzySearcher {
    private fuse: Fuse<SymbolWithFrequency> | null = null;
    private symbols: SymbolWithFrequency[] = [];

    updateIndex(symbols: SymbolInfo[]): void {
        this.symbols = symbols.map(s => ({
            ...s,
            frequency: (s as any).frequency || 0
        }));
        this.fuse = new Fuse(this.symbols, {
            keys: ['name'],
            threshold: 0.3,
            distance: 100,
            includeScore: true,
            includeMatches: true,
            minMatchCharLength: 1,
            findAllMatches: false,
            ignoreLocation: true,
            sortFn: (a, b) => {
                const scoreA = a.score || 1;
                const scoreB = b.score || 1;
                const freqA = (a.item as any).frequency || 0;
                const freqB = (b.item as any).frequency || 0;
                
                const finalA = scoreA * 0.6 - freqA * 0.004;
                const finalB = scoreB * 0.6 - freqB * 0.004;
                
                return finalA - finalB;
            }
        });
    }

    search(query: string, maxResults = 20): FuzzyMatchResult[] {
        if (!this.fuse || !query.trim()) {
            return [];
        }

        const results = this.fuse.search(query, { limit: maxResults });

        return results.map(result => ({
            item: result.item,
            score: result.score || 0,
            indices: [...(result.matches?.[0]?.indices || [])] as [number, number][]
        }));
    }

    searchWithHistory(query: string, maxResults = 20): FuzzyMatchResult[] {
        if (!query.trim()) {
            return [];
        }

        const fuzzyResults = this.search(query, maxResults);
        
        fuzzyResults.sort((a, b) => {
            const freqA = (a.item as SymbolWithFrequency).frequency || 0;
            const freqB = (b.item as SymbolWithFrequency).frequency || 0;
            
            const scoreA = a.score - freqA * 0.01;
            const scoreB = b.score - freqB * 0.01;
            
            return scoreA - scoreB;
        });

        return fuzzyResults.slice(0, maxResults);
    }

    prefixMatch(query: string, maxResults = 20): SymbolInfo[] {
        if (!query.trim()) {
            return [];
        }

        const lowerQuery = query.toLowerCase();
        const results = this.symbols.filter(s => 
            s.name.toLowerCase().startsWith(lowerQuery)
        );

        return results.slice(0, maxResults);
    }

    camelCaseMatch(query: string, maxResults = 20): SymbolInfo[] {
        if (!query.trim()) {
            return [];
        }

        const queryChars = query.toLowerCase().split('');
        
        return this.symbols
            .filter(s => {
                const name = s.name;
                let queryIndex = 0;
                
                for (let i = 0; i < name.length && queryIndex < queryChars.length; i++) {
                    const char = name[i];
                    const isUpper = char === char.toUpperCase() && char !== char.toLowerCase();
                    const isStart = i === 0;
                    
                    if (isUpper || isStart) {
                        if (char.toLowerCase() === queryChars[queryIndex]) {
                            queryIndex++;
                        }
                    }
                }
                
                return queryIndex === queryChars.length;
            })
            .slice(0, maxResults);
    }

    getAllSymbols(): SymbolInfo[] {
        return this.symbols;
    }

    clear(): void {
        this.symbols = [];
        this.fuse = null;
    }
}