import * as vscode from 'vscode';
import { TelnetConnection, ShortcutCommand, CompletionSource } from '../types';

const CONNECTIONS_KEY = 'ipop.connections';
const SHORTCUTS_KEY = 'ipop.shortcuts';
const SOURCES_KEY = 'ipop.completionSources';

export class ConfigStore {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    getConnections(): TelnetConnection[] {
        return this.context.globalState.get<TelnetConnection[]>(CONNECTIONS_KEY, []);
    }

    async saveConnections(connections: TelnetConnection[]): Promise<void> {
        await this.context.globalState.update(CONNECTIONS_KEY, connections);
    }

    async addConnection(connection: TelnetConnection): Promise<void> {
        const connections = this.getConnections();
        connections.push(connection);
        await this.saveConnections(connections);
    }

    async updateConnection(connection: TelnetConnection): Promise<void> {
        const connections = this.getConnections();
        const index = connections.findIndex(c => c.id === connection.id);
        if (index !== -1) {
            connections[index] = connection;
            await this.saveConnections(connections);
        }
    }

    async deleteConnection(id: string): Promise<void> {
        const connections = this.getConnections().filter(c => c.id !== id);
        await this.saveConnections(connections);
    }

    getConnection(id: string): TelnetConnection | undefined {
        return this.getConnections().find(c => c.id === id);
    }

    getShortcuts(): ShortcutCommand[] {
        return this.context.globalState.get<ShortcutCommand[]>(SHORTCUTS_KEY, []);
    }

    async saveShortcuts(shortcuts: ShortcutCommand[]): Promise<void> {
        await this.context.globalState.update(SHORTCUTS_KEY, shortcuts);
    }

    async addShortcut(shortcut: ShortcutCommand): Promise<void> {
        const shortcuts = this.getShortcuts();
        shortcuts.push(shortcut);
        await this.saveShortcuts(shortcuts);
    }

    async deleteShortcut(id: string): Promise<void> {
        const shortcuts = this.getShortcuts().filter(s => s.id !== id);
        await this.saveShortcuts(shortcuts);
    }

    async updateShortcut(id: string, updated: ShortcutCommand): Promise<void> {
        const shortcuts = this.getShortcuts();
        const index = shortcuts.findIndex(s => s.id === id);
        if (index !== -1) {
            shortcuts[index] = updated;
            await this.saveShortcuts(shortcuts);
        }
    }

    generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    getCompletionSources(): CompletionSource[] {
        return this.context.globalState.get<CompletionSource[]>(SOURCES_KEY, []);
    }

    async saveCompletionSources(sources: CompletionSource[]): Promise<void> {
        await this.context.globalState.update(SOURCES_KEY, sources);
    }

    async addCompletionSource(source: CompletionSource): Promise<void> {
        const sources = this.getCompletionSources();
        sources.push(source);
        await this.saveCompletionSources(sources);
    }

    async updateCompletionSource(source: CompletionSource): Promise<void> {
        const sources = this.getCompletionSources();
        const index = sources.findIndex(s => s.id === source.id);
        if (index !== -1) {
            sources[index] = source;
            await this.saveCompletionSources(sources);
        }
    }

    async deleteCompletionSource(id: string): Promise<void> {
        const sources = this.getCompletionSources().filter(s => s.id !== id);
        await this.saveCompletionSources(sources);
    }

    getCompletionSource(id: string): CompletionSource | undefined {
        return this.getCompletionSources().find(s => s.id === id);
    }
}

let store: ConfigStore | undefined;

export function initConfigStore(context: vscode.ExtensionContext): ConfigStore {
    store = new ConfigStore(context);
    return store;
}

export function getConfigStore(): ConfigStore {
    if (!store) {
        throw new Error('ConfigStore not initialized');
    }
    return store;
}