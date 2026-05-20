export interface WebviewMessage {
    command: 'sendCommand' | 'requestCompletion' | 'requestHistory' | 'searchOutput' | 'clearOutput' | 'reconnect' | 'saveHistory' | 'saveTheme' | 'saveMacro' | 'requestCompletions';
    text?: string;
    cursorLine?: number;
    searchTerm?: string;
    theme?: string;
    macroId?: string;
    name?: string;
    commands?: string[];
    partialInput?: string;
}

export interface ExtensionMessage {
    command: 'outputResponse' | 'completionResult' | 'historyList' | 'connectionStatus' | 'saveHistoryResult' | 'clearOutput' | 'completionsList';
    text?: string;
    completion?: string;
    completions?: CompletionItem[];
    history?: string[];
    status?: 'connected' | 'disconnected';
    canReconnect?: boolean;
}

export interface CompletionItem {
    text: string;
    type: 'history' | 'command' | 'symbol';
    detail?: string;
    priority: number;
}

export interface CompletionConfig {
    maxItems: number;
    autoTrigger: boolean;
    minChars: number;
    delay: number;
    sources: {
        history: boolean;
        commands: boolean;
        symbols: boolean;
    };
}

export interface WebViewState {
    connectionId: string;
    connectionName: string;
    host: string;
    port: number;
    encoding: string;
    status: 'connected' | 'disconnected';
    output: string;
    history: string[];
    currentTheme: string;
}