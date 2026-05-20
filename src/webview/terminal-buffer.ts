import { CursorAction, ClearAction, ScrollAction, ANSIToken, StyleState, createDefaultStyle } from './ansi';
import { StyleManager } from './style-manager';

interface LineCell {
    char: string;
    style: StyleState;
}

export class TerminalBuffer {
    private lines: LineCell[][];
    private cursorRow: number;
    private cursorCol: number;
    private savedCursor: { row: number; col: number };
    private maxLines: number;
    private cursorVisible: boolean;
    private cols: number;
    
    constructor(maxLines: number = 1000, cols: number = 80) {
        this.lines = [[]];
        this.cursorRow = 0;
        this.cursorCol = 0;
        this.savedCursor = { row: 0, col: 0 };
        this.maxLines = maxLines;
        this.cursorVisible = true;
        this.cols = cols;
    }
    
    write(text: string): void {
        for (const char of text) {
            this.writeChar(char);
        }
    }
    
    private writeChar(char: string): void {
        if (char === '\n' || char === '\r') {
            if (char === '\r') {
                this.cursorCol = 0;
            } else if (char === '\n') {
                this.newLine();
            }
            return;
        }
        
        if (this.cursorCol >= this.cols) {
            this.newLine();
        }
        
        while (this.cursorRow >= this.lines.length) {
            this.lines.push([]);
        }
        
        while (this.cursorCol > this.lines[this.cursorRow].length) {
            this.lines[this.cursorRow].push({ char: ' ', style: createDefaultStyle() });
        }
        
        if (this.cursorCol < this.lines[this.cursorRow].length) {
            this.lines[this.cursorRow][this.cursorCol] = { char, style: createDefaultStyle() };
        } else {
            this.lines[this.cursorRow].push({ char, style: createDefaultStyle() });
        }
        
        this.cursorCol++;
    }
    
    private newLine(): void {
        this.cursorRow++;
        this.cursorCol = 0;
        
        if (this.cursorRow >= this.maxLines) {
            this.lines.shift();
            this.cursorRow--;
            this.savedCursor.row--;
        }
    }
    
    moveCursor(row: number, col: number): void {
        this.cursorRow = Math.max(0, Math.min(row, this.lines.length - 1));
        this.cursorCol = Math.max(0, col);
    }
    
    moveCursorRelative(dRow: number, dCol: number): void {
        this.cursorRow = Math.max(0, Math.min(this.cursorRow + dRow, this.lines.length));
        this.cursorCol = Math.max(0, this.cursorCol + dCol);
    }
    
    moveCursorUp(n: number): void {
        this.cursorRow = Math.max(0, this.cursorRow - n);
    }
    
    moveCursorDown(n: number): void {
        this.cursorRow = Math.min(this.lines.length, this.cursorRow + n);
    }
    
    moveCursorLeft(n: number): void {
        this.cursorCol = Math.max(0, this.cursorCol - n);
    }
    
    moveCursorRight(n: number): void {
        this.cursorCol += n;
    }
    
    moveCursorToColumn(col: number): void {
        this.cursorCol = Math.max(0, col - 1);
    }
    
    clearScreen(mode: number): void {
        if (mode === 0) {
            for (let i = this.cursorRow; i < this.lines.length; i++) {
                if (i === this.cursorRow) {
                    this.lines[i] = this.lines[i].slice(0, this.cursorCol);
                } else {
                    this.lines[i] = [];
                }
            }
        } else if (mode === 1) {
            for (let i = 0; i <= this.cursorRow; i++) {
                if (i === this.cursorRow) {
                    this.lines[i] = this.lines[i].slice(this.cursorCol);
                    for (let j = 0; j < this.cursorCol; j++) {
                        this.lines[i].unshift({ char: ' ', style: createDefaultStyle() });
                    }
                } else {
                    this.lines[i] = [];
                }
            }
        } else if (mode === 2 || mode === 3) {
            this.lines = [[]];
            this.cursorRow = 0;
            this.cursorCol = 0;
            if (mode === 3) {
                this.savedCursor = { row: 0, col: 0 };
            }
        }
    }
    
    clearLine(mode: number): void {
        if (mode === 0) {
            while (this.cursorRow >= this.lines.length) {
                this.lines.push([]);
            }
            this.lines[this.cursorRow] = this.lines[this.cursorRow].slice(0, this.cursorCol);
        } else if (mode === 1) {
            while (this.cursorRow >= this.lines.length) {
                this.lines.push([]);
            }
            this.lines[this.cursorRow] = this.lines[this.cursorRow].slice(this.cursorCol);
            for (let i = 0; i < this.cursorCol; i++) {
                this.lines[this.cursorRow].unshift({ char: ' ', style: createDefaultStyle() });
            }
        } else if (mode === 2) {
            while (this.cursorRow >= this.lines.length) {
                this.lines.push([]);
            }
            this.lines[this.cursorRow] = [];
        }
    }
    
    scrollUp(n: number): void {
        for (let i = 0; i < n; i++) {
            this.lines.shift();
        }
        if (this.lines.length === 0) {
            this.lines.push([]);
        }
        this.cursorRow = Math.max(0, this.cursorRow - n);
    }
    
    scrollDown(n: number): void {
        for (let i = 0; i < n; i++) {
            this.lines.unshift([]);
        }
        if (this.lines.length > this.maxLines) {
            this.lines = this.lines.slice(0, this.maxLines);
        }
        this.cursorRow = Math.min(this.lines.length - 1, this.cursorRow + n);
    }
    
    saveCursor(): void {
        this.savedCursor = { row: this.cursorRow, col: this.cursorCol };
    }
    
    restoreCursor(): void {
        this.cursorRow = this.savedCursor.row;
        this.cursorCol = this.savedCursor.col;
    }
    
    setCursorVisible(visible: boolean): void {
        this.cursorVisible = visible;
    }
    
    isCursorVisible(): boolean {
        return this.cursorVisible;
    }
    
    getCursorRow(): number {
        return this.cursorRow;
    }
    
    getCursorCol(): number {
        return this.cursorCol;
    }
    
    getLines(): LineCell[][] {
        return this.lines;
    }
    
    getLineCount(): number {
        return this.lines.length;
    }
    
    getText(): string {
        return this.lines.map(line => 
            line.map(cell => cell.char).join('')
        ).join('\n');
    }
    
    clear(): void {
        this.lines = [[]];
        this.cursorRow = 0;
        this.cursorCol = 0;
        this.savedCursor = { row: 0, col: 0 };
    }
}