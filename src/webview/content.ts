import * as vscode from 'vscode';
import { predefinedThemes, getThemeCSS, TerminalTheme } from './themes';

export interface WebviewConfig {
    sendShortcut: string;
    maxHistorySize: number;
    autoScroll: boolean;
    inputMaxHeight: number;
    maxOutputLines: number;
    themeId: string;
}

export function getWebviewContent(webview: vscode.Webview, connectionInfo: {
    name: string;
    host: string;
    port: number;
    encoding: string;
}, config: WebviewConfig): string {
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
        
        .filter-container {
            background: #2d2d2d;
            padding: 5px;
            border-top: 1px solid #3c3c3c;
        }
        
        .filter-inputs {
            display: flex;
            gap: 5px;
            align-items: center;
        }
        
        .filter-input {
            background: #3c3c3c;
            color: #d4d4d4;
            border: none;
            padding: 3px 5px;
            border-radius: 3px;
            font-size: 12px;
            width: 150px;
        }
        
        .filter-select {
            background: #3c3c3c;
            color: #d4d4d4;
            border: none;
            padding: 3px 5px;
            border-radius: 3px;
            font-size: 12px;
        }
        
        .filter-list {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            padding: 5px 0;
        }
        
        .filter-item {
            display: flex;
            align-items: center;
            gap: 5px;
            background: #3c3c3c;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 11px;
        }
        
        .filter-item-color {
            width: 12px;
            height: 12px;
            border-radius: 2px;
        }
        
        .filter-item-remove {
            background: none;
            border: none;
            color: #cd3131;
            cursor: pointer;
            font-size: 14px;
            padding: 0;
        }
        
        .highlight-filter {
            background: rgba(255, 215, 0, 0.3);
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
            max-height: ${config.inputMaxHeight}px;
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
                    <select class="filter-select" id="themeSelect">
                        ${predefinedThemes.map(t => `<option value="${t.id}" ${t.id === config.themeId ? 'selected' : ''}>${t.name}</option>`).join('')}
                    </select>
                    <button class="toolbar-button" id="filterToggleButton">Filter</button>
                    <button class="toolbar-button" id="clearButton">Clear</button>
                    <button class="toolbar-button" id="exportButton">Export</button>
                </div>
            </div>
            <div class="filter-container" id="filterContainer" style="display: none;">
                <div class="filter-inputs">
                    <input type="text" class="filter-input" id="filterPattern" placeholder="Regex pattern...">
                    <select class="filter-select" id="filterMode">
                        <option value="highlight">Highlight</option>
                        <option value="hide">Hide</option>
                        <option value="show">Show only</option>
                    </select>
                    <button class="toolbar-button" id="addFilterButton">Add</button>
                    <button class="toolbar-button" id="clearFiltersButton">Clear all</button>
                </div>
                <div class="filter-list" id="filterList"></div>
            </div>
            <div class="output-content" id="outputContent"></div>
        </div>
        
        <div class="terminal-input">
            <textarea class="input-area" id="inputArea" rows="5" placeholder="Enter commands..."></textarea>
            <div class="input-toolbar">
                <div class="shortcut-hints">
                    <span>${config.sendShortcut}: Send current line</span>
                    <span>Up/Down: History</span>
                    <span>Tab: Completion</span>
                </div>
                <div class="auto-scroll-toggle">
                    <input type="checkbox" id="autoScrollCheckbox" ${config.autoScroll ? 'checked' : ''}>
                    <label for="autoScrollCheckbox">Auto-scroll</label>
                </div>
            </div>
        </div>
    </div>
    
    <div class="tooltip" id="tooltip"></div>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        const themes = [
            { id: 'dark', name: 'Dark (Default)' },
            { id: 'light', name: 'Light' },
            { id: 'solarized-dark', name: 'Solarized Dark' },
            { id: 'monokai', name: 'Monokai' },
            { id: 'high-contrast', name: 'High Contrast' }
        ];
        
        const config = {
            sendShortcut: '${config.sendShortcut}',
            maxHistorySize: ${config.maxHistorySize},
            maxOutputLines: ${config.maxOutputLines},
            autoScroll: ${config.autoScroll},
            themeId: '${config.themeId}'
        };
        
        let commandHistory = [];
        let historyIndex = -1;
        let savedInput = '';
        let isAutoScroll = config.autoScroll;
        let originalOutput = '';
        let activeFilters = [];
        let isRecording = false;
        let currentMacro = [];
        let savedMacros = [];
        
        const outputContent = document.getElementById('outputContent');
        const inputArea = document.getElementById('inputArea');
        const searchInput = document.getElementById('searchInput');
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        const reconnectButton = document.getElementById('reconnectButton');
        const clearButton = document.getElementById('clearButton');
        const autoScrollCheckbox = document.getElementById('autoScrollCheckbox');
        const filterToggleButton = document.getElementById('filterToggleButton');
        const filterContainer = document.getElementById('filterContainer');
        const filterPattern = document.getElementById('filterPattern');
        const filterMode = document.getElementById('filterMode');
        const addFilterButton = document.getElementById('addFilterButton');
        const clearFiltersButton = document.getElementById('clearFiltersButton');
        const filterList = document.getElementById('filterList');
        const themeSelect = document.getElementById('themeSelect');
        
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
            
            // Limit output lines for performance
            const lines = originalOutput.split('\\n');
            if (lines.length > config.maxOutputLines) {
                const trimmedLines = lines.slice(-config.maxOutputLines);
                outputContent.textContent = trimmedLines.join('\\n');
                originalOutput = outputContent.textContent;
            }
            
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
        
        function matchShortcut(e, shortcut) {
            const parts = shortcut.split('+');
            const mainKey = parts[parts.length - 1];
            
            if (parts.length === 1) {
                return e.key === mainKey;
            }
            
            const hasCtrl = parts.includes('Ctrl');
            const hasShift = parts.includes('Shift');
            const hasAlt = parts.includes('Alt');
            
            return e.key === mainKey &&
                   (hasCtrl ? e.ctrlKey : !e.ctrlKey) &&
                   (hasShift ? e.shiftKey : !e.shiftKey) &&
                   (hasAlt ? e.altKey : !e.altKey);
        }
        
        inputArea.addEventListener('keydown', (e) => {
            if (matchShortcut(e, config.sendShortcut)) {
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
                    
                    if (isRecording) {
                        currentMacro.push(lineText.trim());
                    }
                    
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
        
        // Filter functionality
        filterToggleButton.addEventListener('click', () => {
            const isVisible = filterContainer.style.display !== 'none';
            filterContainer.style.display = isVisible ? 'none' : 'block';
            filterToggleButton.textContent = isVisible ? 'Filter' : 'Hide Filter';
        });
        
        addFilterButton.addEventListener('click', () => {
            const pattern = filterPattern.value;
            const mode = filterMode.value;
            
            if (!pattern) return;
            
            try {
                new RegExp(pattern);
            } catch (e) {
                showTooltip('Invalid regex', 0, 0);
                return;
            }
            
            activeFilters.push({
                pattern,
                mode,
                color: getRandomColor()
            });
            
            filterPattern.value = '';
            updateFilterList();
            applyFilters();
        });
        
        clearFiltersButton.addEventListener('click', () => {
            activeFilters = [];
            updateFilterList();
            outputContent.textContent = originalOutput;
        });
        
        function getRandomColor() {
            const colors = ['#ffd700', '#00ff00', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
            return colors[Math.floor(Math.random() * colors.length)];
        }
        
        function updateFilterList() {
            filterList.innerHTML = '';
            activeFilters.forEach((filter, index) => {
                const filterItem = document.createElement('div');
                filterItem.className = 'filter-item';
                filterItem.innerHTML = \`<div class="filter-item-color" style="background: \${filter.color}"></div><span>\${filter.pattern}</span><span>\${filter.mode}</span><button class="filter-item-remove" onclick="removeFilter(\${index})">×</button>\`;
                filterList.appendChild(filterItem);
            });
        }
        
        function removeFilter(index) {
            activeFilters.splice(index, 1);
            updateFilterList();
            applyFilters();
        }
        
        function applyFilters() {
            if (activeFilters.length === 0) {
                outputContent.textContent = originalOutput;
                return;
            }
            
            let filteredOutput = originalOutput;
            
            activeFilters.forEach(filter => {
                try {
                    const regex = new RegExp(filter.pattern, 'gm');
                    
                    if (filter.mode === 'highlight') {
                        filteredOutput = filteredOutput.replace(regex, 
                            \`<span style="background: \${filter.color}; color: #000; padding: 1px 2px;">\$&</span>\`
                        );
                    } else if (filter.mode === 'hide') {
                        filteredOutput = filteredOutput.replace(regex, '');
                    } else if (filter.mode === 'show') {
                        const matches = filteredOutput.match(regex) || [];
                        filteredOutput = matches.join('\\n');
                    }
                } catch (e) {}
            });
            
            outputContent.innerHTML = filteredOutput.replace(/\\n/g, '<br>');
        }
        
        // Theme functionality
        themeSelect.addEventListener('change', (e) => {
            const themeId = e.target.value;
            applyTheme(themeId);
            
            vscode.postMessage({
                command: 'saveTheme',
                theme: themeId
            });
        });
        
        function applyTheme(themeId) {
            const themeColors = {
                'dark': { bg: '#1e1e1e', fg: '#d4d4d4', toolbarBg: '#2d2d2d', inputBg: '#2d2d2d' },
                'light': { bg: '#ffffff', fg: '#000000', toolbarBg: '#f0f0f0', inputBg: '#f0f0f0' },
                'solarized-dark': { bg: '#002b36', fg: '#839496', toolbarBg: '#073642', inputBg: '#073642' },
                'monokai': { bg: '#272822', fg: '#f8f8f2', toolbarBg: '#3e3d32', inputBg: '#3e3d32' },
                'high-contrast': { bg: '#000000', fg: '#ffffff', toolbarBg: '#1a1a1a', inputBg: '#1a1a1a' }
            };
            
            const colors = themeColors[themeId] || themeColors['dark'];
            
            document.body.style.background = colors.bg;
            document.body.style.color = colors.fg;
            
            document.querySelectorAll('.status-bar, .output-toolbar, .filter-container, .terminal-input').forEach(el => {
                el.style.background = colors.toolbarBg;
            });
            
            document.querySelectorAll('.search-input, .filter-input, .filter-select, .toolbar-button, .input-area').forEach(el => {
                el.style.background = colors.inputBg;
                el.style.color = colors.fg;
            });
        }
        
        // Apply initial theme
        applyTheme(config.themeId);
        
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
        
        // Export functionality
        const exportButton = document.getElementById('exportButton');
        exportButton.addEventListener('click', () => {
            const format = 'txt';
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
            const filename = \`output-\${timestamp}.txt\`;
            
            const content = originalOutput;
            
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            
            URL.revokeObjectURL(url);
            
            showTooltip('Exported!', 0, 0);
        });
        
        // Macro functionality
        let macroRecordButton = null;
        let macroPlayButton = null;
        
        function startRecording() {
            isRecording = true;
            currentMacro = [];
            showTooltip('Recording started', 0, 0);
        }
        
        function stopRecording() {
            isRecording = false;
            if (currentMacro.length > 0) {
                const macroName = \`Macro \${savedMacros.length + 1}\`;
                savedMacros.push({
                    name: macroName,
                    commands: currentMacro.slice()
                });
                showTooltip(\`Macro saved: \${macroName} (\${currentMacro.length} commands)\`, 0, 0);
            }
            currentMacro = [];
        }
        
        function playMacro(index) {
            const macro = savedMacros[index];
            if (!macro) return;
            
            macro.commands.forEach((cmd, i) => {
                setTimeout(() => {
                    vscode.postMessage({
                        command: 'sendCommand',
                        text: cmd
                    });
                }, i * 200);
            });
            
            showTooltip(\`Playing macro: \${macro.name}\`, 0, 0);
        }
        
        inputArea.focus();
    </script>
</body>
</html>`;
}