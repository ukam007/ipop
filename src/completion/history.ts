import * as vscode from 'vscode';
import { SymbolInfo } from '../types';

interface HistoryEntry {
    text: string;
    count: number;
    lastUsed: number;
    source: 'user' | 'completion';
}

export class CommandHistory {
    private history: Map<string, HistoryEntry> = new Map();
    private maxHistorySize: number = 500;
    private context: vscode.ExtensionContext;
    
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.loadHistory();
    }
    
    private loadHistory(): void {
        const saved = this.context.globalState.get<Record<string, HistoryEntry>>('ipop.history', {});
        for (const [key, entry] of Object.entries(saved)) {
            this.history.set(key, entry);
        }
    }
    
    private saveHistory(): void {
        const obj: Record<string, HistoryEntry> = {};
        this.history.forEach((entry, key) => {
            obj[key] = entry;
        });
        this.context.globalState.update('ipop.history', obj);
    }
    
    recordCommand(text: string, source: 'user' | 'completion' = 'user'): void {
        const trimmed = text.trim();
        if (!trimmed || trimmed.length < 2) return;
        
        const existing = this.history.get(trimmed);
        if (existing) {
            existing.count++;
            existing.lastUsed = Date.now();
            existing.source = source;
        } else {
            this.history.set(trimmed, {
                text: trimmed,
                count: 1,
                lastUsed: Date.now(),
                source
            });
        }
        
        if (this.history.size > this.maxHistorySize) {
            this.pruneHistory();
        }
        
        this.saveHistory();
    }
    
    private pruneHistory(): void {
        const entries = Array.from(this.history.entries())
            .sort((a, b) => a[1].lastUsed - b[1].lastUsed);
        
        const toRemove = entries.slice(0, Math.floor(this.maxHistorySize * 0.2));
        for (const [key] of toRemove) {
            this.history.delete(key);
        }
    }
    
    getFrequency(text: string): number {
        const entry = this.history.get(text.trim());
        return entry?.count || 0;
    }
    
    getRecentCommands(limit: number = 10): string[] {
        return Array.from(this.history.entries())
            .sort((a, b) => b[1].lastUsed - a[1].lastUsed)
            .slice(0, limit)
            .map(([key]) => key);
    }
    
    getFrequentCommands(limit: number = 10): string[] {
        return Array.from(this.history.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, limit)
            .map(([key]) => key);
    }
    
    searchHistory(query: string, limit: number = 10): string[] {
        const lowerQuery = query.toLowerCase();
        return Array.from(this.history.entries())
            .filter(([key]) => key.toLowerCase().includes(lowerQuery))
            .sort((a, b) => {
                const scoreA = a[1].count * 0.7 + (Date.now() - a[1].lastUsed) / 100000;
                const scoreB = b[1].count * 0.7 + (Date.now() - b[1].lastUsed) / 100000;
                return scoreB - scoreA;
            })
            .slice(0, limit)
            .map(([key]) => key);
    }
    
    enrichSymbolsWithFrequency(symbols: SymbolInfo[]): SymbolInfo[] {
        return symbols.map(s => ({
            ...s,
            frequency: this.getFrequency(s.insertText)
        }));
    }
    
    clear(): void {
        this.history.clear();
        this.saveHistory();
    }
    
    getStats(): { totalCommands: number; topCommands: string[] } {
        return {
            totalCommands: this.history.size,
            topCommands: this.getFrequentCommands(5)
        };
    }
}

let historyInstance: CommandHistory | undefined;

export function initHistory(context: vscode.ExtensionContext): void {
    historyInstance = new CommandHistory(context);
}

export function getHistory(): CommandHistory {
    if (!historyInstance) {
        throw new Error('CommandHistory not initialized. Call initHistory first.');
    }
    return historyInstance;
}