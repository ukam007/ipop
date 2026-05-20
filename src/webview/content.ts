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
        
        .term-line {
            white-space: pre;
            min-height: 1.2em;
        }
        
        .cursor-block {
            background: #d4d4d4;
            color: #1e1e1e;
            padding: 0;
        }
        
        .cursor-underline {
            text-decoration: underline;
            text-decoration-color: #d4d4d4;
            text-decoration-thickness: 2px;
        }
        
        .cursor-bar {
            border-left: 2px solid #d4d4d4;
            padding-left: 1px;
        }
        
        .cursor-blink {
            animation: cursorBlink 1s step-end infinite;
        }
        
        @keyframes cursorBlink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
        }
        
        .completion-dropdown {
            position: absolute;
            background: #252526;
            border: 1px solid #454545;
            border-radius: 3px;
            max-height: 200px;
            overflow-y: auto;
            z-index: 1000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        
        .completion-item {
            padding: 4px 8px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 13px;
        }
        
        .completion-item:hover,
        .completion-item.selected {
            background: #094771;
        }
        
        .completion-item-text {
            color: #d4d4d4;
        }
        
        .completion-item-type {
            color: #808080;
            font-size: 11px;
            margin-left: 10px;
        }
        
        .completion-item-detail {
            color: #608b4e;
            font-size: 11px;
            font-style: italic;
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
        
        // ANSI Standard Colors (256-color support)
        const ANSI_COLORS = {
            30: '#000000', 31: '#cd3131', 32: '#0dbc79', 33: '#e5e510',
            34: '#2472c8', 35: '#bc3fbc', 36: '#11a8cd', 37: '#e5e5e5',
            40: '#000000', 41: '#cd3131', 42: '#0dbc79', 43: '#e5e510',
            44: '#2472c8', 45: '#bc3fbc', 46: '#11a8cd', 47: '#e5e5e5',
            90: '#808080', 91: '#f14c4c', 92: '#23d18b', 93: '#f5f543',
            94: '#3b8eea', 95: '#d670d6', 96: '#29d8d8', 97: '#e5e5e5',
            100: '#808080', 101: '#f14c4c', 102: '#23d18b', 103: '#f5f543',
            104: '#3b8eea', 105: '#d670d6', 106: '#29d8d8', 107: '#e5e5e5'
        };
        
        function color256ToRGB(n) {
            if (n < 16) {
                const fg = [30,31,32,33,34,35,36,37,90,91,92,93,94,95,96,97];
                return ANSI_COLORS[fg[n]] || '#000000';
            } else if (n < 232) {
                const r = Math.floor((n - 16) / 36) * 51;
                const g = Math.floor(((n - 16) % 36) / 6) * 51;
                const b = ((n - 16) % 6) * 51;
                return 'rgb(' + r + ',' + g + ',' + b + ')';
            } else {
                const gray = 8 + (n - 232) * 10;
                return 'rgb(' + gray + ',' + gray + ',' + gray + ')';
            }
        }
        
        function escapeHtml(text) {
            return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ /g, '&nbsp;');
        }
        
        class TerminalRenderer {
            constructor(maxLines = 1000) {
                this.maxLines = maxLines;
                this.lines = [];
                this.styleStack = [];
                this.currentStyle = this.createDefaultStyle();
            }
            
            createDefaultStyle() {
                return { fg: null, bg: null, bold: false, dim: false, italic: false, underline: false, blink: false, inverse: false, hidden: false, strike: false };
            }
            
            parseSGR(params) {
                if (!params || params === '0') {
                    return this.createDefaultStyle();
                }
                
                const style = {};
                const codes = params.split(';').map(c => parseInt(c, 10));
                
                for (let i = 0; i < codes.length; i++) {
                    const code = codes[i];
                    
                    if (code === 0) return this.createDefaultStyle();
                    else if (code === 1) style.bold = true;
                    else if (code === 2) style.dim = true;
                    else if (code === 3) style.italic = true;
                    else if (code === 4) style.underline = true;
                    else if (code === 5 || code === 6) style.blink = true;
                    else if (code === 7) style.inverse = true;
                    else if (code === 8) style.hidden = true;
                    else if (code === 9) style.strike = true;
                    else if (code === 22) { style.bold = false; style.dim = false; }
                    else if (code === 23) style.italic = false;
                    else if (code === 24) style.underline = false;
                    else if (code === 25) style.blink = false;
                    else if (code === 27) style.inverse = false;
                    else if (code === 28) style.hidden = false;
                    else if (code === 29) style.strike = false;
                    else if (code >= 30 && code <= 37) style.fg = ANSI_COLORS[code];
                    else if (code === 38 && i + 1 < codes.length) {
                        const mode = codes[i + 1];
                        if (mode === 5 && i + 2 < codes.length) {
                            style.fg = color256ToRGB(codes[i + 2]);
                            i += 2;
                        } else if (mode === 2 && i + 4 < codes.length) {
                            style.fg = 'rgb(' + codes[i+2] + ',' + codes[i+3] + ',' + codes[i+4] + ')';
                            i += 4;
                        }
                    }
                    else if (code === 39) style.fg = null;
                    else if (code >= 40 && code <= 47) style.bg = ANSI_COLORS[code];
                    else if (code === 48 && i + 1 < codes.length) {
                        const mode = codes[i + 1];
                        if (mode === 5 && i + 2 < codes.length) {
                            style.bg = color256ToRGB(codes[i + 2]);
                            i += 2;
                        } else if (mode === 2 && i + 4 < codes.length) {
                            style.bg = 'rgb(' + codes[i+2] + ',' + codes[i+3] + ',' + codes[i+4] + ')';
                            i += 4;
                        }
                    }
                    else if (code === 49) style.bg = null;
                    else if (code >= 90 && code <= 97) style.fg = ANSI_COLORS[code];
                    else if (code >= 100 && code <= 107) style.bg = ANSI_COLORS[code];
                }
                
                return style;
            }
            
            styleToCSS(style) {
                const parts = [];
                if (style.fg) parts.push('color: ' + style.fg);
                if (style.bg) parts.push('background: ' + style.bg);
                if (style.bold) parts.push('font-weight: bold');
                if (style.dim) parts.push('opacity: 0.5');
                if (style.italic) parts.push('font-style: italic');
                if (style.underline) parts.push('text-decoration: underline');
                if (style.strike) parts.push('text-decoration: ' + (style.underline ? 'underline line-through' : 'line-through'));
                if (style.inverse) parts.push('filter: invert(1)');
                if (style.hidden) parts.push('visibility: hidden');
                return parts.join('; ');
            }
            
            process(text) {
                const lines = [];
                let currentLine = [];
                let i = 0;
                
                while (i < text.length) {
                    if (text[i] === '\\x1b' || (text[i] === '\\u001b' || text.charCodeAt(i) === 27)) {
                        if (i + 1 < text.length && text[i + 1] === '[') {
                            let j = i + 2;
                            let params = '';
                            while (j < text.length && /[0-9;]/.test(text[j])) {
                                params += text[j];
                                j++;
                            }
                            if (j < text.length) {
                                const cmd = text[j];
                                if (cmd === 'm') {
                                    const newStyle = this.parseSGR(params);
                                    this.currentStyle = { ...this.currentStyle, ...newStyle };
                                }
                                i = j + 1;
                                continue;
                            }
                        }
                    }
                    
                    if (text[i] === '\\n') {
                        lines.push(currentLine);
                        currentLine = [];
                        i++;
                        continue;
                    }
                    
                    if (text[i] === '\\r') {
                        i++;
                        continue;
                    }
                    
                    currentLine.push({ char: text[i], style: { ...this.currentStyle } });
                    i++;
                }
                
                if (currentLine.length > 0 || lines.length > 0) {
                    lines.push(currentLine);
                }
                
                return lines;
            }
            
            renderLine(line) {
                if (line.length === 0) return '<div class="term-line">&nbsp;</div>';
                
                let html = '<div class="term-line">';
                let currentSpan = '';
                let currentCSS = '';
                
                for (const cell of line) {
                    const css = this.styleToCSS(cell.style);
                    if (css !== currentCSS) {
                        if (currentSpan) {
                            html += currentCSS ? '<span style="' + currentCSS + '">' + escapeHtml(currentSpan) + '</span>' : escapeHtml(currentSpan);
                        }
                        currentSpan = cell.char;
                        currentCSS = css;
                    } else {
                        currentSpan += cell.char;
                    }
                }
                
                if (currentSpan) {
                    html += currentCSS ? '<span style="' + currentCSS + '">' + escapeHtml(currentSpan) + '</span>' : escapeHtml(currentSpan);
                }
                
                html += '</div>';
                return html;
            }
            
            render(text) {
                const lines = this.process(text);
                
                // Limit lines for performance
                if (lines.length > this.maxLines) {
                    lines.splice(0, lines.length - this.maxLines);
                }
                
                this.lines = this.lines.concat(lines);
                if (this.lines.length > this.maxLines) {
                    this.lines = this.lines.slice(this.lines.length - this.maxLines);
                }
                
                return this.lines.map(line => this.renderLine(line)).join('\\n');
            }
            
            clear() {
                this.lines = [];
                this.currentStyle = this.createDefaultStyle();
            }
            
            stripANSI(text) {
                return text.replace(/\\x1b\\[[0-9;]*[A-Za-z]/g, '').replace(/\\u001b\\[[0-9;]*[A-Za-z]/g, '');
            }
        }
        
        const renderer = new TerminalRenderer(config.maxOutputLines);
        
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
        let completionDropdown = null;
        let currentCompletions = [];
        let selectedCompletionIndex = 0;
        let completionPrefix = '';
        let autoCompletionTimer = null;
        let completionConfig = {
            autoTrigger: false,
            minChars: 2,
            delay: 200
        };
        
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
        
        // Create completion dropdown
        completionDropdown = document.createElement('div');
        completionDropdown.className = 'completion-dropdown';
        completionDropdown.style.display = 'none';
        document.body.appendChild(completionDropdown);
        
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
            
            if (message.command === 'completionsList') {
                showCompletionDropdown(message.completions || []);
            }
            
            if (message.command === 'historyList') {
                commandHistory = message.history || [];
            }
        });
        
        function appendOutput(text) {
            const html = renderer.render(text);
            outputContent.innerHTML = html;
            originalOutput = renderer.stripANSI(text);
            
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
            
            hideCompletionDropdown();
            inputArea.focus();
        }
        
        function showCompletionDropdown(completions) {
            if (completions.length === 0) {
                hideCompletionDropdown();
                return;
            }
            
            currentCompletions = completions;
            selectedCompletionIndex = 0;
            
            const cursorPos = inputArea.selectionStart;
            const textBefore = inputArea.value.substring(0, cursorPos);
            const lastWordMatch = textBefore.match(/\\S+$/);
            completionPrefix = lastWordMatch ? lastWordMatch[0] : '';
            
            // Build dropdown content
            completionDropdown.innerHTML = completions.map((item, index) => 
                '<div class="completion-item' + (index === 0 ? ' selected' : '') + '" data-index="' + index + '">' +
                    '<div>' +
                        '<span class="completion-item-text">' + escapeHtml(item.text) + '</span>' +
                        '<span class="completion-item-type">[' + item.type + ']</span>' +
                    '</div>' +
                    (item.detail ? '<div class="completion-item-detail">' + escapeHtml(item.detail) + '</div>' : '') +
                '</div>'
            ).join('');
            
            // Position dropdown above input area
            const inputRect = inputArea.getBoundingClientRect();
            completionDropdown.style.left = inputRect.left + 'px';
            completionDropdown.style.bottom = (window.innerHeight - inputRect.top + 5) + 'px';
            completionDropdown.style.maxWidth = inputRect.width + 'px';
            completionDropdown.style.display = 'block';
            
            // Add click handlers
            completionDropdown.querySelectorAll('.completion-item').forEach(item => {
                item.addEventListener('click', () => {
                    const index = parseInt(item.dataset.index);
                    selectCompletion(index);
                });
            });
        }
        
        function hideCompletionDropdown() {
            completionDropdown.style.display = 'none';
            currentCompletions = [];
            selectedCompletionIndex = 0;
        }
        
        function selectCompletion(index) {
            if (index < 0 || index >= currentCompletions.length) return;
            
            const item = currentCompletions[index];
            applyCompletion(item.text);
        }
        
        function navigateCompletion(direction) {
            if (currentCompletions.length === 0) return;
            
            const oldIndex = selectedCompletionIndex;
            selectedCompletionIndex += direction;
            
            if (selectedCompletionIndex < 0) {
                selectedCompletionIndex = currentCompletions.length - 1;
            } else if (selectedCompletionIndex >= currentCompletions.length) {
                selectedCompletionIndex = 0;
            }
            
            // Update selection visual
            completionDropdown.querySelectorAll('.completion-item').forEach((item, i) => {
                item.classList.toggle('selected', i === selectedCompletionIndex);
            });
        }
        
        function isDropdownVisible() {
            return completionDropdown.style.display !== 'none';
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
            // Handle completion dropdown navigation
            if (isDropdownVisible()) {
                if (e.key === 'Tab') {
                    e.preventDefault();
                    navigateCompletion(e.shiftKey ? -1 : 1);
                    return;
                }
                
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    navigateCompletion(-1);
                    return;
                }
                
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    navigateCompletion(1);
                    return;
                }
                
                if (e.key === 'Enter') {
                    e.preventDefault();
                    selectCompletion(selectedCompletionIndex);
                    return;
                }
                
                if (e.key === 'Escape') {
                    e.preventDefault();
                    hideCompletionDropdown();
                    return;
                }
            }
            
            if (matchShortcut(e, config.sendShortcut)) {
                e.preventDefault();
                sendCurrentLineOrSelection();
            }
            
            if (e.key === 'Tab' && !isDropdownVisible()) {
                e.preventDefault();
                requestCompletions();
            }
            
            if (e.key === 'ArrowUp' && !isDropdownVisible()) {
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
            
            if (e.key === 'ArrowDown' && !isDropdownVisible()) {
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
        
        function requestCompletions() {
            const cursorPos = inputArea.selectionStart;
            const textBefore = inputArea.value.substring(0, cursorPos);
            const lastWordMatch = textBefore.match(/\\S+$/);
            const lastWord = lastWordMatch ? lastWordMatch[0] : '';
            
            if (lastWord.length >= 2) {
                vscode.postMessage({
                    command: 'requestCompletions',
                    partialInput: lastWord
                });
            }
        }
        
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            
            if (!searchTerm) {
                const html = renderer.lines.map(line => renderer.renderLine(line)).join('\\n');
                outputContent.innerHTML = html;
                return;
            }
            
            const html = renderer.lines.map(line => {
                const lineText = line.map(c => c.char).join('');
                if (lineText.toLowerCase().includes(searchTerm)) {
                    const rendered = renderer.renderLine(line);
                    return rendered.replace(new RegExp(searchTerm, 'gi'), '<span class="highlight">$&</span>');
                }
                return renderer.renderLine(line);
            }).join('\\n');
            
            outputContent.innerHTML = html;
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
            const html = renderer.lines.map(line => renderer.renderLine(line)).join('\\n');
            outputContent.innerHTML = html;
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
                const html = renderer.lines.map(line => renderer.renderLine(line)).join('\\n');
                outputContent.innerHTML = html;
                return;
            }
            
            let filteredLines = renderer.lines.slice();
            
            activeFilters.forEach(filter => {
                try {
                    const regex = new RegExp(filter.pattern, 'gm');
                    
                    filteredLines = filteredLines.map(line => {
                        const lineText = line.map(c => c.char).join('');
                        
                        if (filter.mode === 'hide') {
                            if (regex.test(lineText)) {
                                return [];
                            }
                            return line;
                        } else if (filter.mode === 'show') {
                            if (regex.test(lineText)) {
                                return line;
                            }
                            return [];
                        }
                        return line;
                    });
                } catch (e) {}
            });
            
            let html = filteredLines.map(line => renderer.renderLine(line)).join('\\n');
            
            // Apply highlight filters
            activeFilters.filter(f => f.mode === 'highlight').forEach(filter => {
                try {
                    const regex = new RegExp(filter.pattern, 'gi');
                    html = html.replace(regex, '<span style="background: ' + filter.color + '; color: #000; padding: 1px 2px;">$&</span>');
                } catch (e) {}
            });
            
            outputContent.innerHTML = html;
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
            renderer.clear();
            outputContent.innerHTML = '';
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
        
        // Auto completion trigger
        inputArea.addEventListener('input', (e) => {
            if (!completionConfig.autoTrigger) return;
            
            if (autoCompletionTimer) {
                clearTimeout(autoCompletionTimer);
            }
            
            const cursorPos = inputArea.selectionStart;
            const textBefore = inputArea.value.substring(0, cursorPos);
            const lastWordMatch = textBefore.match(/\\S+$/);
            const lastWord = lastWordMatch ? lastWordMatch[0] : '';
            
            if (lastWord.length >= completionConfig.minChars) {
                autoCompletionTimer = setTimeout(() => {
                    vscode.postMessage({
                        command: 'requestCompletions',
                        partialInput: lastWord
                    });
                }, completionConfig.delay);
            } else {
                hideCompletionDropdown();
            }
        });
        
        // Hide dropdown on blur
        inputArea.addEventListener('blur', (e) => {
            setTimeout(() => {
                if (!completionDropdown.contains(document.activeElement)) {
                    hideCompletionDropdown();
                }
            }, 100);
        });
        
        inputArea.focus();
    </script>
</body>
</html>`;
}