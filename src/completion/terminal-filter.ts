import * as vscode from 'vscode';

export function getMinTriggerChars(): number {
    const config = vscode.workspace.getConfiguration('ipop.completion');
    return config.get<number>('minChars', 2);
}

export function isAutoCompletionEnabled(): boolean {
    const config = vscode.workspace.getConfiguration('ipop.completion');
    return config.get<boolean>('autoTrigger', true);
}

export function isTabCompletionEnabled(): boolean {
    const config = vscode.workspace.getConfiguration('ipop.completion');
    return config.get<boolean>('tabTrigger', true);
}

export function isShowHintEnabled(): boolean {
    const config = vscode.workspace.getConfiguration('ipop.completion');
    return config.get<boolean>('showHint', true);
}

export function getHintDelay(): number {
    const config = vscode.workspace.getConfiguration('ipop.completion');
    return config.get<number>('hintDelay', 200);
}