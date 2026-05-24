import * as vscode from 'vscode';
import { ShortcutCommand } from '../types';
import { getConfigStore } from '../config/store';
import { getShortcutsProvider } from '../sidebar/provider';
import { WebViewPanelRegistry } from '../webview/panel';

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
        id: getConfigStore().generateId(),
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

export async function editShortcut(shortcut: ShortcutCommand): Promise<void> {
    const name = await vscode.window.showInputBox({
        prompt: 'Shortcut name',
        placeHolder: 'Enter shortcut name',
        value: shortcut.name
    });

    if (!name) return;

    const command = await vscode.window.showInputBox({
        prompt: 'Command',
        placeHolder: 'Enter command text',
        value: shortcut.command
    });

    if (!command) return;

    const description = await vscode.window.showInputBox({
        prompt: 'Description (optional)',
        placeHolder: 'Enter description',
        value: shortcut.description || ''
    });

    const updated: ShortcutCommand = {
        id: shortcut.id,
        name,
        command,
        description
    };

    await getConfigStore().updateShortcut(shortcut.id, updated);
    getShortcutsProvider().refresh();
    vscode.window.showInformationMessage(`Shortcut "${name}" updated`);
}

export async function sendShortcut(shortcut: ShortcutCommand): Promise<void> {
    const registry = WebViewPanelRegistry.getInstance();
    const panels = registry.getAll();

    if (panels.length === 0) {
        vscode.window.showWarningMessage('No active IPOP connection');
        return;
    }

    if (panels.length === 1) {
        const conn = panels[0].getConnection();
        if (!panels[0].sendExternalCommand(shortcut.command)) {
            vscode.window.showWarningMessage(`Connection "${conn.name}" is not active`);
        }
        return;
    }

    const items = panels.map(p => ({
        label: p.getConnection().name,
        detail: `${p.getConnection().host}:${p.getConnection().port}`,
        panel: p
    }));

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select IPOP connection to send command'
    });

    if (!selected) return;
    selected.panel.sendExternalCommand(shortcut.command);
}