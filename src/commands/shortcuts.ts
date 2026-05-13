import * as vscode from 'vscode';
import { ShortcutCommand } from '../types';
import { getConfigStore } from '../config/store';
import { getShortcutsProvider } from '../sidebar/provider';

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export async function addShortcut(): Promise<void> {
    const name = await vscode.window.showInputBox({
        prompt: 'Shortcut name',
        placeHolder: 'Enter shortcut name'
    });

    if (!name) return;

    const command = await vscode.window.showInputBox({
        prompt: 'Command',
        placeHolder: 'Enter command text'
    });

    if (!command) return;

    const description = await vscode.window.showInputBox({
        prompt: 'Description (optional)',
        placeHolder: 'Enter description'
    });

    const shortcut: ShortcutCommand = {
        id: generateId(),
        name,
        command,
        description
    };

    await getConfigStore().addShortcut(shortcut);
    getShortcutsProvider().refresh();
    vscode.window.showInformationMessage(`Shortcut "${name}" added`);
}

export async function deleteShortcut(shortcut: ShortcutCommand): Promise<void> {
    const confirm = await vscode.window.showWarningMessage(
        `Delete shortcut "${shortcut.name}"?`,
        'Yes', 'No'
    );

    if (confirm !== 'Yes') return;

    await getConfigStore().deleteShortcut(shortcut.id);
    getShortcutsProvider().refresh();
    vscode.window.showInformationMessage(`Shortcut "${shortcut.name}" deleted`);
}

export async function sendShortcut(shortcut: ShortcutCommand): Promise<void> {
    const terminals = vscode.window.terminals;
    
    if (terminals.length === 0) {
        vscode.window.showWarningMessage('No active terminal');
        return;
    }

    const terminalNames = terminals.map(t => t.name);
    const selected = await vscode.window.showQuickPick(terminalNames, {
        placeHolder: 'Select terminal to send command'
    });

    if (!selected) return;

    const terminal = terminals.find(t => t.name === selected);
    if (terminal) {
        terminal.sendText(shortcut.command);
    }
}