import * as vscode from 'vscode';

export function getWebviewContent(webview: vscode.Webview, connectionInfo: {
    name: string;
    host: string;
    port: number;
    encoding: string;
}): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IPOP Terminal - ${connectionInfo.name}</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            height: 100vh;
            display: flex;
            flex-direction: column;
            background: #1e1e1e;
            color: #d4d4d4;
            font-family: 'Courier New', Consolas, monospace;
            font-size: 14px;
        }
        
        .ipop-container {
            height: 100%;
            display: flex;
            flex-direction: column;
        }
        
        .status-bar {
            padding: 5px 10px;
            background: #2d2d2d;
            border-bottom: 1px solid #3c3c3c;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .connection-info {
            color: #808080;
            font-size: 12px;
        }
        
        .connection-status {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .status-indicator {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #cd3131;
        }
        
        .status-dot.connected {
            background: #0dbc79;
        }
        
        .reconnect-button {
            background: #0e639c;
            color: #d4d4d4;
            border: none;
            padding: 3px 10px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .reconnect-button:hover {
            background: #1177bb;
        }
        
        .terminal-output {
            flex: 1;
            min-height: 300px;
            display: flex;
            flex-direction: column;
            border-bottom: 3px solid #3c3c3c;
        }
        
        .output-toolbar {
            padding: 5px;
            background: #2d2d2d;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .search-container {
            display: flex;
            gap: 10px;
            align-items: center;
        }
        
        .search-input {
            background: #3c3c3c;
            color: #d4d4d4;
            border: none;
            padding: 5px 10px;
            border-radius: 3px;
            font-size: 12px;
            width: 200px;
        }
        
        .search-input:focus {
            outline: 1px solid #0e639c;
        }
        
        .toolbar-buttons {
            display: flex;
            gap: 5px;
        }
        
        .toolbar-button {
            background: #3c3c3c;
            color: #d4d4d4;
            border: none;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .toolbar-button:hover {
            background: #505050;
        }
        
        .output-content {
            flex: 1;
            padding: 10px;
            overflow-y: auto;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        
        .output-line {
            cursor: pointer;
        }
        
        .output-line:hover {
            background: #2d2d2d;
        }
        
        .highlight {
            background: #ffd700;
            color: #000000;
        }
        
        .terminal-input {
            min-height: 100px;
            max-height: 400px;
            padding: 10px;
            display: flex;
            flex-direction: column;
        }
        
        .input-area {
            flex: 1;
            background: #2d2d2d;
            color: #d4d4d4;
            border: 1px solid #3c3c3c;
            padding: 10px;
            font-family: 'Courier New', Consolas, monospace;
            font-size: 14px;
            resize: none;
            outline: none;
        }
        
        .input-area:focus {
            border-color: #0e639c;
        }
        
        .input-toolbar {
            padding-top: 5px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            color: #808080;
        }
        
        .shortcut-hints {
            display: flex;
            gap: 15px;
        }
        
        .auto-scroll-toggle {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .auto-scroll-toggle input {
            cursor: pointer;
        }
        
        .tooltip {
            position: fixed;
            background: #0e639c;
            color: #d4d4d4;
            padding: 5px 10px;
            border-radius: 3px;
            font-size: 12px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s;
        }
        
        .tooltip.show {
            opacity: 1;
        }
        
        ::-webkit-scrollbar {
            width: 10px;
        }
        
        ::-webkit-scrollbar-track {
            background: #1e1e1e;
        }
        
        ::-webkit-scrollbar-thumb {
            background: #424242;
            border-radius: 5px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: #4f4f4f;
        }
    </style>
</head>
<body>
    <div class="ipop-container">
        <div class="status-bar">
            <div class="connection-info">
                ${connectionInfo.name} (${connectionInfo.host}:${connectionInfo.port}) - ${connectionInfo.encoding}
            </div>
            <div class="connection-status">
                <div class="status-indicator">
                    <div class="status-dot" id="statusDot"></div>
                    <span id="statusText">Disconnected</span>
                </div>
                <button class="reconnect-button" id="reconnectButton" style="display: none;">Reconnect</button>
            </div>
        </div>
        
        <div class="terminal-output">
            <div class="output-toolbar">
                <div class="search-container">
                    <input type="text" class="search-input" id="searchInput" placeholder="Search output...">
                </div>
                <div class="toolbar-buttons">
                    <button class="toolbar-button" id="clearButton">Clear</button>
                    <button class="toolbar-button" id="exportButton">Export</button>
                </div>
            </div>
            <div class="output-content" id="outputContent"></div>
        </div>
        
        <div class="terminal-input">
            <textarea class="input-area" id="inputArea" rows="5" placeholder="Enter commands..."></textarea>
            <div class="input-toolbar">
                <div class="shortcut-hints">
                    <span>F8: Send current line</span>
                    <span>Up/Down: History</span>
                    <span>Tab: Completion</span>
                </div>
                <div class="auto-scroll-toggle">
                    <input type="checkbox" id="autoScrollCheckbox" checked>
                    <label for="autoScrollCheckbox">Auto-scroll</label>
                </div>
            </div>
        </div>
    </div>
    
    <div class="tooltip" id="tooltip"></div>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        let commandHistory = [];
        let historyIndex = -1;
        let savedInput = '';
        let isAutoScroll = true;
        let originalOutput = '';
        
        const outputContent = document.getElementById('outputContent');
        const inputArea = document.getElementById('inputArea');
        const searchInput = document.getElementById('searchInput');
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        const reconnectButton = document.getElementById('reconnectButton');
        const clearButton = document.getElementById('clearButton');
        const autoScrollCheckbox = document.getElementById('autoScrollCheckbox');
        
        window.addEventListener('message', (event) => {
            const message = event.data;
            
            if (message.command === 'outputResponse') {
                appendOutput(message.text);
            }
            
            if (message.command === 'connectionStatus') {
                updateConnectionStatus(message.status, message.canReconnect);
            }
            
            if (message.command === 'completionResult') {
                applyCompletion(message.completion);
            }
            
            if (message.command === 'historyList') {
                commandHistory = message.history || [];
            }
        });
        
        function appendOutput(text) {
            outputContent.textContent += text;
            originalOutput = outputContent.textContent;
            
            if (isAutoScroll) {
                outputContent.scrollTop = outputContent.scrollHeight;
            }
        }
        
        function updateConnectionStatus(status, canReconnect) {
            statusDot.className = 'status-dot ' + (status === 'connected' ? 'connected' : '');
            statusText.textContent = status === 'connected' ? 'Connected' : 'Disconnected';
            reconnectButton.style.display = canReconnect ? 'block' : 'none';
        }
        
        function applyCompletion(completion) {
            const cursorPos = inputArea.selectionStart;
            const textBefore = inputArea.value.substring(0, cursorPos);
            const lastWordMatch = textBefore.match(/\\S+$/);
            const lastWordStart = lastWordMatch ? cursorPos - lastWordMatch[0].length : cursorPos;
            
            const before = inputArea.value.substring(0, lastWordStart);
            const after = inputArea.value.substring(cursorPos);
            
            inputArea.value = before + completion + after;
            inputArea.setSelectionRange(
                before.length + completion.length,
                before.length + completion.length
            );
            
            inputArea.focus();
        }
        
        inputArea.addEventListener('keydown', (e) => {
            if (e.key === 'F8') {
                e.preventDefault();
                sendCurrentLineOrSelection();
            }
            
            if (e.key === 'Tab') {
                e.preventDefault();
                requestCompletion();
            }
            
            if (e.key === 'ArrowUp') {
                if (inputArea.selectionStart === 0 && historyIndex < commandHistory.length - 1) {
                    e.preventDefault();
                    if (historyIndex === -1) {
                        savedInput = inputArea.value;
                    }
                    historyIndex++;
                    inputArea.value = commandHistory[historyIndex];
                    inputArea.setSelectionRange(0, 0);
                }
            }
            
            if (e.key === 'ArrowDown') {
                if (inputArea.selectionStart === inputArea.value.length) {
                    e.preventDefault();
                    if (historyIndex > 0) {
                        historyIndex--;
                        inputArea.value = commandHistory[historyIndex];
                        inputArea.setSelectionRange(inputArea.value.length, inputArea.value.length);
                    } else if (historyIndex === 0) {
                        historyIndex = -1;
                        inputArea.value = savedInput;
                        inputArea.setSelectionRange(inputArea.value.length, inputArea.value.length);
                    }
                }
            }
        });
        
        function sendCurrentLineOrSelection() {
            const selectionStart = inputArea.selectionStart;
            const selectionEnd = inputArea.selectionEnd;
            
            if (selectionStart !== selectionEnd) {
                const selectedText = inputArea.value.substring(selectionStart, selectionEnd);
                const lines = selectedText.split('\\n').filter(line => line.trim());
                
                lines.forEach((line, index) => {
                    setTimeout(() => {
                        vscode.postMessage({
                            command: 'sendCommand',
                            text: line.trim()
                        });
                    }, index * 100);
                });
            } else {
                const lines = inputArea.value.split('\\n');
                let currentLineIndex = 0;
                let pos = 0;
                
                for (let i = 0; i < lines.length; i++) {
                    if (pos + lines[i].length >= selectionStart) {
                        currentLineIndex = i;
                        break;
                    }
                    pos += lines[i].length + 1;
                }
                
                const lineText = lines[currentLineIndex];
                if (lineText.trim()) {
                    vscode.postMessage({
                        command: 'sendCommand',
                        text: lineText.trim()
                    });
                    
                    commandHistory.unshift(lineText.trim());
                    historyIndex = -1;
                }
            }
        }
        
        function requestCompletion() {
            const cursorPos = inputArea.selectionStart;
            const textBefore = inputArea.value.substring(0, cursorPos);
            const lastWordMatch = textBefore.match(/\\S+$/);
            const lastWord = lastWordMatch ? lastWordMatch[0] : '';
            
            if (lastWord.length >= 2) {
                vscode.postMessage({
                    command: 'requestCompletion',
                    text: lastWord
                });
            }
        }
        
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            
            if (!searchTerm) {
                outputContent.innerHTML = originalOutput.replace(/\\n/g, '<br>');
                return;
            }
            
            const lines = originalOutput.split('\\n');
            const highlighted = lines.map(line => {
                if (line.toLowerCase().includes(searchTerm)) {
                    return line.replace(
                        new RegExp(searchTerm, 'gi'),
                        '<span class="highlight">$&</span>'
                    );
                }
                return line;
            }).join('<br>');
            
            outputContent.innerHTML = highlighted;
        });
        
        clearButton.addEventListener('click', () => {
            outputContent.textContent = '';
            originalOutput = '';
            vscode.postMessage({
                command: 'clearOutput'
            });
        });
        
        reconnectButton.addEventListener('click', () => {
            vscode.postMessage({
                command: 'reconnect'
            });
        });
        
        autoScrollCheckbox.addEventListener('change', (e) => {
            isAutoScroll = e.target.checked;
        });
        
        outputContent.addEventListener('click', (e) => {
            const selection = window.getSelection();
            if (selection.toString()) {
                navigator.clipboard.writeText(selection.toString());
                showTooltip('Copied!', e.clientX, e.clientY);
            }
        });
        
        function showTooltip(text, x, y) {
            const tooltip = document.getElementById('tooltip');
            tooltip.textContent = text;
            tooltip.style.left = x + 'px';
            tooltip.style.top = y + 'px';
            tooltip.classList.add('show');
            
            setTimeout(() => {
                tooltip.classList.remove('show');
            }, 2000);
        }
        
        inputArea.focus();
    </script>
</body>
</html>`;
}