import * as vscode from 'vscode';

export type Encoding = 'utf-8' | 'gbk' | 'gb2312' | 'big5';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';
export type SymbolKind = 'function' | 'class' | 'method' | 'variable' | 'macro' | 'typedef' | 'command';
export type CompletionSourceType = 'workspace' | 'external' | 'custom';

export interface TelnetConnection {
    id: string;
    name: string;
    host: string;
    port: number;
    encoding: Encoding;
    autoConnect?: boolean;
    description?: string;
}

export interface ShortcutCommand {
    id: string;
    name: string;
    command: string;
    description?: string;
}

export interface CustomSymbol {
    name: string;
    kind: SymbolKind;
    detail?: string;
    insertText: string;
}

export interface CompletionSource {
    id: string;
    name: string;
    type: CompletionSourceType;
    path?: string;
    symbols?: CustomSymbol[];
    enabled: boolean;
    filePatterns?: string[];
}

export interface SymbolInfo {
    id: string;
    name: string;
    kind: SymbolKind;
    detail?: string;
    insertText: string;
    filePath?: string;
    line?: number;
    sourceId: string;
}

export interface TelnetCompletionItem {
    label: string;
    kind: vscode.CompletionItemKind;
    detail?: string;
    insertText: string;
    score: number;
}

export interface ConnectionStatusInfo {
    connectionId: string;
    status: ConnectionStatus;
    terminal?: vscode.Terminal;
}

export interface TelnetClientEvents {
    onConnect: () => void;
    onDisconnect: () => void;
    onData: (data: string) => void;
    onError: (error: Error) => void;
}

export interface FuzzyMatchResult {
    item: SymbolInfo;
    score: number;
    indices: [number, number][];
}

export const SYMBOL_KIND_TO_VSCODE: Record<SymbolKind, vscode.CompletionItemKind> = {
    function: vscode.CompletionItemKind.Function,
    class: vscode.CompletionItemKind.Class,
    method: vscode.CompletionItemKind.Method,
    variable: vscode.CompletionItemKind.Variable,
    macro: vscode.CompletionItemKind.Constant,
    typedef: vscode.CompletionItemKind.TypeParameter,
    command: vscode.CompletionItemKind.Keyword
};