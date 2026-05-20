import { ANSIParser, ANSIToken } from './ansi';
import { StyleManager } from './style-manager';
import { TerminalBuffer } from './terminal-buffer';

export interface RenderOptions {
    showCursor?: boolean;
    cursorStyle?: 'block' | 'underline' | 'bar';
    cursorBlink?: boolean;
}

export class TerminalRenderer {
    private parser: ANSIParser;
    private styleManager: StyleManager;
    private buffer: TerminalBuffer;
    
    constructor(maxLines: number = 1000, cols: number = 80) {
        this.parser = new ANSIParser();
        this.styleManager = new StyleManager();
        this.buffer = new TerminalBuffer(maxLines, cols);
    }
    
    process(data: string): void {
        const tokens = this.parser.parse(data);
        
        for (const token of tokens) {
            this.processToken(token);
        }
    }
    
    private processToken(token: ANSIToken): void {
        switch (token.type) {
            case 'text':
                if (token.text) {
                    this.buffer.write(token.text);
                }
                break;
                
            case 'sgr':
                if (token.style) {
                    this.styleManager.applyStyle(token.style);
                }
                break;
                
            case 'cursor':
                if (token.cursorAction) {
                    this.handleCursorAction(token.cursorAction);
                }
                break;
                
            case 'clear':
                if (token.clearAction) {
                    this.handleClearAction(token.clearAction);
                }
                break;
                
            case 'scroll':
                if (token.scrollAction) {
                    this.handleScrollAction(token.scrollAction);
                }
                break;
                
            case 'cursor-show':
                this.buffer.setCursorVisible(true);
                break;
                
            case 'cursor-hide':
                this.buffer.setCursorVisible(false);
                break;
        }
    }
    
    private handleCursorAction(action: { type: string; row?: number; col?: number; n?: number }): void {
        switch (action.type) {
            case 'move':
                this.buffer.moveCursor(action.row ?? 0, action.col ?? 0);
                break;
            case 'up':
                this.buffer.moveCursorUp(action.n ?? 1);
                break;
            case 'down':
                this.buffer.moveCursorDown(action.n ?? 1);
                break;
            case 'left':
                this.buffer.moveCursorLeft(action.n ?? 1);
                break;
            case 'right':
                this.buffer.moveCursorRight(action.n ?? 1);
                break;
            case 'column':
                this.buffer.moveCursorToColumn(action.col ?? 1);
                break;
            case 'save':
                this.buffer.saveCursor();
                break;
            case 'restore':
                this.buffer.restoreCursor();
                break;
        }
    }
    
    private handleClearAction(action: { type: string; mode: number }): void {
        if (action.type === 'screen') {
            this.buffer.clearScreen(action.mode);
        } else {
            this.buffer.clearLine(action.mode);
        }
    }
    
    private handleScrollAction(action: { type: string; n: number }): void {
        if (action.type === 'up') {
            this.buffer.scrollUp(action.n);
        } else {
            this.buffer.scrollDown(action.n);
        }
    }
    
    render(options: RenderOptions = {}): string {
        const lines = this.buffer.getLines();
        const html: string[] = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineHtml = this.renderLine(line, i === this.buffer.getCursorRow(), options);
            html.push(`<div class="term-line">${lineHtml}</div>`);
        }
        
        return html.join('\n');
    }
    
    private renderLine(cells: { char: string; style: {} }[], isCursorLine: boolean, options: RenderOptions): string {
        if (cells.length === 0) {
            if (isCursorLine && this.buffer.isCursorVisible() && options.showCursor) {
                return this.renderCursor(' ', options);
            }
            return '&nbsp;';
        }
        
        let html = '';
        let currentSpan = '';
        let currentStyle: {} = {};
        let col = 0;
        
        for (const cell of cells) {
            const styleChanged = this.stylesDiffer(currentStyle, cell.style);
            
            if (styleChanged && currentSpan) {
                html += this.wrapWithStyle(currentSpan, currentStyle);
                currentSpan = '';
            }
            
            currentStyle = cell.style;
            currentSpan += cell.char;
            col++;
        }
        
        if (currentSpan) {
            html += this.wrapWithStyle(currentSpan, currentStyle);
        }
        
        if (isCursorLine && this.buffer.isCursorVisible() && options.showCursor) {
            html = this.insertCursor(html, options);
        }
        
        return html || '&nbsp;';
    }
    
    private stylesDiffer(style1: {}, style2: {}): boolean {
        return JSON.stringify(style1) !== JSON.stringify(style2);
    }
    
    private wrapWithStyle(text: string, style: {}): string {
        const css = this.styleToCSS(style);
        if (css) {
            return `<span style="${css}">${this.escapeHtml(text)}</span>`;
        }
        return this.escapeHtml(text);
    }
    
    private styleToCSS(style: Partial<{ fgColor: string | null; bgColor: string | null; bold: boolean; dim: boolean; italic: boolean; underline: boolean; blink: boolean; inverse: boolean; hidden: boolean; strikethrough: boolean }>): string {
        const parts: string[] = [];
        
        if (style.fgColor) parts.push(`color: ${style.fgColor}`);
        if (style.bgColor) parts.push(`background: ${style.bgColor}`);
        if (style.bold) parts.push('font-weight: bold');
        if (style.dim) parts.push('opacity: 0.5');
        if (style.italic) parts.push('font-style: italic');
        if (style.underline) parts.push('text-decoration: underline');
        if (style.strikethrough) {
            if (style.underline) {
                parts.push('text-decoration: underline line-through');
            } else {
                parts.push('text-decoration: line-through');
            }
        }
        if (style.inverse) parts.push('filter: invert(1)');
        if (style.hidden) parts.push('visibility: hidden');
        
        return parts.join('; ');
    }
    
    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/ /g, '&nbsp;');
    }
    
    private renderCursor(char: string, options: RenderOptions): string {
        const style = options.cursorStyle || 'block';
        const blink = options.cursorBlink !== false ? 'cursor-blink' : '';
        
        if (style === 'block') {
            return `<span class="cursor-block ${blink}">${this.escapeHtml(char)}</span>`;
        } else if (style === 'underline') {
            return `<span class="cursor-underline ${blink}">${this.escapeHtml(char)}</span>`;
        } else {
            return `<span class="cursor-bar ${blink}">${this.escapeHtml(char)}</span>`;
        }
    }
    
    private insertCursor(html: string, options: RenderOptions): string {
        const cursorCol = this.buffer.getCursorCol();
        let col = 0;
        let result = '';
        let i = 0;
        
        while (i < html.length) {
            if (html[i] === '<') {
                const endTag = html.indexOf('>', i);
                if (endTag === -1) {
                    result += html.slice(i);
                    break;
                }
                result += html.slice(i, endTag + 1);
                i = endTag + 1;
                
                if (html[i - 2] === '/') continue;
                
                while (i < html.length && html[i] !== '<') {
                    const char = html[i] === '&' ? this.decodeEntity(html, i) : html[i];
                    const entityLen = html[i] === '&' ? html.indexOf(';', i) - i + 1 : 1;
                    
                    if (col === cursorCol && this.buffer.isCursorVisible()) {
                        result += this.renderCursor(char, options);
                    } else {
                        result += html.slice(i, i + entityLen);
                    }
                    
                    col++;
                    i += entityLen;
                }
            } else {
                result += html[i];
                i++;
            }
        }
        
        return result;
    }
    
    private decodeEntity(html: string, start: number): string {
        const end = html.indexOf(';', start);
        if (end === -1) return html[start];
        
        const entity = html.slice(start, end + 1);
        switch (entity) {
            case '&nbsp;': return ' ';
            case '&lt;': return '<';
            case '&gt;': return '>';
            case '&amp;': return '&';
            default: return entity;
        }
    }
    
    getText(): string {
        return this.buffer.getText();
    }
    
    clear(): void {
        this.buffer.clear();
        this.styleManager.reset();
    }
    
    getBuffer(): TerminalBuffer {
        return this.buffer;
    }
    
    stripANSI(text: string): string {
        return this.parser.stripANSI(text);
    }
}