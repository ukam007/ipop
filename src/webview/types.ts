export interface WebviewMessage {
    command: 'sendCommand' | 'requestCompletion' | 'requestHistory' | 'searchOutput' | 'clearOutput' | 'reconnect' | 'saveHistory' | 'saveTheme' | 'saveMacro';
    text?: string;
    cursorLine?: number;
    searchTerm?: string;
    theme?: string;
    macroId?: string;
    name?: string;
    commands?: string[];
}

export interface ExtensionMessage {
    command: 'outputResponse' | 'completionResult' | 'historyList' | 'connectionStatus' | 'saveHistoryResult' | 'clearOutput';
    text?: string;
    completion?: string;
    completions?: string[];
    history?: string[];
    status?: 'connected' | 'disconnected';
    canReconnect?: boolean;
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