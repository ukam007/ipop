import * as vscode from 'vscode';

export class ShortcutConfig {
    private context: vscode.ExtensionContext;
    
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }
    
    getSendShortcut(): string {
        const config = vscode.workspace.getConfiguration('ipop.webview');
        return config.get<string>('sendShortcut', 'F8');
    }
    
    getMaxHistorySize(): number {
        const config = vscode.workspace.getConfiguration('ipop.webview');
        return config.get<number>('maxHistorySize', 100);
    }
    
    getAutoScroll(): boolean {
        const config = vscode.workspace.getConfiguration('ipop.webview');
        return config.get<boolean>('autoScroll', true);
    }
    
    getInputMaxHeight(): number {
        const config = vscode.workspace.getConfiguration('ipop.webview');
        return config.get<number>('inputMaxHeight', 400);
    }
    
    getMaxOutputLines(): number {
        const config = vscode.workspace.getConfiguration('ipop.webview');
        return config.get<number>('maxOutputLines', 1000);
    }
    
    async setSendShortcut(key: string): Promise<void> {
        const config = vscode.workspace.getConfiguration('ipop.webview');
        await config.update('sendShortcut', key, vscode.ConfigurationTarget.Global);
    }
    
    async setMaxHistorySize(size: number): Promise<void> {
        const config = vscode.workspace.getConfiguration('ipop.webview');
        await config.update('maxHistorySize', size, vscode.ConfigurationTarget.Global);
    }
    
    async setAutoScroll(enabled: boolean): Promise<void> {
        const config = vscode.workspace.getConfiguration('ipop.webview');
        await config.update('autoScroll', enabled, vscode.ConfigurationTarget.Global);
    }
    
    async setInputMaxHeight(height: number): Promise<void> {
        const config = vscode.workspace.getConfiguration('ipop.webview');
        await config.update('inputMaxHeight', height, vscode.ConfigurationTarget.Global);
    }
    
    async setMaxOutputLines(lines: number): Promise<void> {
        const config = vscode.workspace.getConfiguration('ipop.webview');
        await config.update('maxOutputLines', lines, vscode.ConfigurationTarget.Global);
    }
}

let shortcutConfigInstance: ShortcutConfig | undefined;

export function initShortcutConfig(context: vscode.ExtensionContext): void {
    shortcutConfigInstance = new ShortcutConfig(context);
}

export function getShortcutConfig(): ShortcutConfig {
    if (!shortcutConfigInstance) {
        throw new Error('ShortcutConfig not initialized. Call initShortcutConfig first.');
    }
    return shortcutConfigInstance;
}

export function registerShortcutCommands(): vscode.Disposable[] {
    return [
        vscode.commands.registerCommand('ipop.configureSendShortcut', async () => {
            const current = getShortcutConfig().getSendShortcut();
            const key = await vscode.window.showInputBox({
                prompt: 'Enter send shortcut key (e.g., F8, Ctrl+Enter, Ctrl+Shift+Enter)',
                placeHolder: current,
                value: current
            });
            
            if (key) {
                await getShortcutConfig().setSendShortcut(key);
                vscode.window.showInformationMessage(`Send shortcut updated to: ${key}`);
                
                vscode.window.showInformationMessage(
                    'Note: You need to restart VSCode or reload the WebView panel to apply the new shortcut.'
                );
            }
        }),
        
        vscode.commands.registerCommand('ipop.configureMaxHistory', async () => {
            const current = getShortcutConfig().getMaxHistorySize();
            const sizeStr = await vscode.window.showInputBox({
                prompt: 'Enter maximum history size',
                placeHolder: current.toString(),
                value: current.toString()
            });
            
            if (sizeStr) {
                const size = parseInt(sizeStr, 10);
                if (size > 0 && size <= 500) {
                    await getShortcutConfig().setMaxHistorySize(size);
                    vscode.window.showInformationMessage(`Max history size updated to: ${size}`);
                } else {
                    vscode.window.showErrorMessage('Invalid size. Please enter a number between 1 and 500.');
                }
            }
        }),
        
        vscode.commands.registerCommand('ipop.configureMaxOutputLines', async () => {
            const current = getShortcutConfig().getMaxOutputLines();
            const linesStr = await vscode.window.showInputBox({
                prompt: 'Enter maximum output lines (for performance)',
                placeHolder: current.toString(),
                value: current.toString()
            });
            
            if (linesStr) {
                const lines = parseInt(linesStr, 10);
                if (lines > 0 && lines <= 10000) {
                    await getShortcutConfig().setMaxOutputLines(lines);
                    vscode.window.showInformationMessage(`Max output lines updated to: ${lines}`);
                } else {
                    vscode.window.showErrorMessage('Invalid lines. Please enter a number between 1 and 10000.');
                }
            }
        }),
        
        vscode.commands.registerCommand('ipop.toggleAutoScroll', async () => {
            const current = getShortcutConfig().getAutoScroll();
            await getShortcutConfig().setAutoScroll(!current);
            vscode.window.showInformationMessage(`Auto scroll ${!current ? 'enabled' : 'disabled'}`);
        })
    ];
}