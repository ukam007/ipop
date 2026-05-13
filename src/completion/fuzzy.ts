import Fuse from 'fuse.js';
import { SymbolInfo, FuzzyMatchResult } from '../types';

export class FuzzySearcher {
    private fuse: Fuse<SymbolInfo> | null = null;
    private symbols: SymbolInfo[] = [];

    updateIndex(symbols: SymbolInfo[]): void {
        this.symbols = symbols;
        this.fuse = new Fuse(symbols, {
            keys: ['name'],
            threshold: 0.4,
            distance: 100,
            includeScore: true,
            includeMatches: true,
            minMatchCharLength: 1,
            findAllMatches: false,
            ignoreLocation: true,
            sortFn: (a, b) => {
                const scoreA = a.score || 1;
                const scoreB = b.score || 1;
                return scoreA - scoreB;
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