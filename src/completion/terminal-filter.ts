import * as vscode from 'vscode';
import { getTerminalRegistry } from '../terminal/manager';

const IPOP_TERMINAL_PATTERN = /\(.+:\d+\)/;
const IPOP_KEYWORDS = ['IPOP', 'Telnet', 'ipop'];

export function isIPOPTerminal(terminal: vscode.Terminal): boolean {
    const name = terminal.name;
    
    if (!name) {
        return false;
    }
    
    for (const keyword of IPOP_KEYWORDS) {
        if (name.includes(keyword)) {
            return true;
        }
    }
    
    if (IPOP_TERMINAL_PATTERN.test(name)) {
        return true;
    }
    
    const registry = getTerminalRegistry();
    for (const manager of registry.getAll().values()) {
        const managedTerminal = manager.getTerminal();
        if (managedTerminal && managedTerminal === terminal) {
            return true;
        }
    }
    
    return false;
}

export function getIPOPTerminals(): vscode.Terminal[] {
    return vscode.window.terminals.filter(isIPOPTerminal);
}

export function getActiveIPOPTerminal(): vscode.Terminal | undefined {
    const active = vscode.window.activeTerminal;
    if (active && isIPOPTerminal(active)) {
        return active;
    }
    
    const ipopTerminals = getIPOPTerminals();
    return ipopTerminals.length > 0 ? ipopTerminals[0] : undefined;
}

export function shouldTriggerCompletion(terminal: vscode.Terminal): boolean {
    const config = vscode.workspace.getConfiguration('ipop.completion');
    const scope = config.get<string>('scope', 'ipop');
    
    if (scope === 'all') {
        return true;
    }
    
    return isIPOPTerminal(terminal);
}

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