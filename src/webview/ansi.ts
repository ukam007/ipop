export interface StyleState {
    fgColor: string | null;
    bgColor: string | null;
    bold: boolean;
    dim: boolean;
    italic: boolean;
    underline: boolean;
    blink: boolean;
    inverse: boolean;
    hidden: boolean;
    strikethrough: boolean;
}

export interface CursorAction {
    type: 'move' | 'up' | 'down' | 'left' | 'right' | 'save' | 'restore' | 'show' | 'hide' | 'column';
    row?: number;
    col?: number;
    n?: number;
}

export interface ClearAction {
    type: 'screen' | 'line';
    mode: 0 | 1 | 2 | 3;
}

export interface ScrollAction {
    type: 'up' | 'down';
    n: number;
}

export interface ANSIToken {
    type: 'text' | 'sgr' | 'cursor' | 'clear' | 'scroll' | 'cursor-show' | 'cursor-hide';
    text?: string;
    style?: Partial<StyleState>;
    cursorAction?: CursorAction;
    clearAction?: ClearAction;
    scrollAction?: ScrollAction;
}

const ANSI_STANDARD_COLORS: Record<number, string> = {
    30: '#000000',
    31: '#cd3131',
    32: '#0dbc79',
    33: '#e5e510',
    34: '#2472c8',
    35: '#bc3fbc',
    36: '#11a8cd',
    37: '#e5e5e5',
    40: '#000000',
    41: '#cd3131',
    42: '#0dbc79',
    43: '#e5e510',
    44: '#2472c8',
    45: '#bc3fbc',
    46: '#11a8cd',
    47: '#e5e5e5',
    90: '#808080',
    91: '#f14c4c',
    92: '#23d18b',
    93: '#f5f543',
    94: '#3b8eea',
    95: '#d670d6',
    96: '#29d8d8',
    97: '#e5e5e5',
    100: '#808080',
    101: '#f14c4c',
    102: '#23d18b',
    103: '#f5f543',
    104: '#3b8eea',
    105: '#d670d6',
    106: '#29d8d8',
    107: '#e5e5e5'
};

function color256ToRGB(n: number): string {
    if (n < 16) {
        if (n < 8) return ANSI_STANDARD_COLORS[30 + n];
        return ANSI_STANDARD_COLORS[90 + (n - 8)];
    } else if (n < 232) {
        const r = Math.floor((n - 16) / 36) * 51;
        const g = Math.floor(((n - 16) % 36) / 6) * 51;
        const b = ((n - 16) % 6) * 51;
        return `rgb(${r},${g},${b})`;
    } else {
        const gray = 8 + (n - 232) * 10;
        return `rgb(${gray},${gray},${gray})`;
    }
}

export function createDefaultStyle(): StyleState {
    return {
        fgColor: null,
        bgColor: null,
        bold: false,
        dim: false,
        italic: false,
        underline: false,
        blink: false,
        inverse: false,
        hidden: false,
        strikethrough: false
    };
}

export class ANSIParser {
    parseSGR(params: string): Partial<StyleState> {
        const style: Partial<StyleState> = {};
        
        if (!params || params === '0') {
            return { ...createDefaultStyle() };
        }
        
        const codes = params.split(';').map(c => parseInt(c, 10));
        
        for (let i = 0; i < codes.length; i++) {
            const code = codes[i];
            
            if (code === 0) {
                return { ...createDefaultStyle() };
            } else if (code === 1) {
                style.bold = true;
            } else if (code === 2) {
                style.dim = true;
            } else if (code === 3) {
                style.italic = true;
            } else if (code === 4) {
                style.underline = true;
            } else if (code === 5 || code === 6) {
                style.blink = true;
            } else if (code === 7) {
                style.inverse = true;
            } else if (code === 8) {
                style.hidden = true;
            } else if (code === 9) {
                style.strikethrough = true;
            } else if (code === 21) {
                style.bold = false;
            } else if (code === 22) {
                style.bold = false;
                style.dim = false;
            } else if (code === 23) {
                style.italic = false;
            } else if (code === 24) {
                style.underline = false;
            } else if (code === 25) {
                style.blink = false;
            } else if (code === 27) {
                style.inverse = false;
            } else if (code === 28) {
                style.hidden = false;
            } else if (code === 29) {
                style.strikethrough = false;
            } else if (code >= 30 && code <= 37) {
                style.fgColor = ANSI_STANDARD_COLORS[code];
            } else if (code === 38) {
                if (i + 1 < codes.length) {
                    const mode = codes[i + 1];
                    if (mode === 5 && i + 2 < codes.length) {
                        const colorN = codes[i + 2];
                        style.fgColor = color256ToRGB(colorN);
                        i += 2;
                    } else if (mode === 2 && i + 4 < codes.length) {
                        const r = codes[i + 2];
                        const g = codes[i + 3];
                        const b = codes[i + 4];
                        style.fgColor = `rgb(${r},${g},${b})`;
                        i += 4;
                    }
                }
            } else if (code === 39) {
                style.fgColor = null;
            } else if (code >= 40 && code <= 47) {
                style.bgColor = ANSI_STANDARD_COLORS[code];
            } else if (code === 48) {
                if (i + 1 < codes.length) {
                    const mode = codes[i + 1];
                    if (mode === 5 && i + 2 < codes.length) {
                        const colorN = codes[i + 2];
                        style.bgColor = color256ToRGB(colorN);
                        i += 2;
                    } else if (mode === 2 && i + 4 < codes.length) {
                        const r = codes[i + 2];
                        const g = codes[i + 3];
                        const b = codes[i + 4];
                        style.bgColor = `rgb(${r},${g},${b})`;
                        i += 4;
                    }
                }
            } else if (code === 49) {
                style.bgColor = null;
            } else if (code >= 90 && code <= 97) {
                style.fgColor = ANSI_STANDARD_COLORS[code];
            } else if (code >= 100 && code <= 107) {
                style.bgColor = ANSI_STANDARD_COLORS[code];
            }
        }
        
        return style;
    }
    
    parseCursorMove(sequence: string): CursorAction | null {
        const match = sequence.match(/^(\d*)([ABCDG])$/);
        if (!match) return null;
        
        const n = match[1] ? parseInt(match[1], 10) : 1;
        const dir = match[2];
        
        switch (dir) {
            case 'A': return { type: 'up', n };
            case 'B': return { type: 'down', n };
            case 'C': return { type: 'right', n };
            case 'D': return { type: 'left', n };
            case 'G': return { type: 'column', col: n };
        }
        
        return null;
    }
    
    parseCursorPosition(sequence: string): CursorAction | null {
        const match = sequence.match(/^(\d*);(\d*)[Hf]$/);
        if (!match) return null;
        
        const row = match[1] ? parseInt(match[1], 10) - 1 : 0;
        const col = match[2] ? parseInt(match[2], 10) - 1 : 0;
        
        return { type: 'move', row, col };
    }
    
    parseClear(sequence: string): ClearAction | null {
        const match = sequence.match(/^([0-3]?)[JK]$/);
        if (!match) return null;
        
        const mode = match[1] ? parseInt(match[1], 10) as 0 | 1 | 2 | 3 : 0;
        const type = sequence.endsWith('J') ? 'screen' : 'line';
        
        return { type, mode };
    }
    
    parseScroll(sequence: string): ScrollAction | null {
        const match = sequence.match(/^(\d*)[ST]$/);
        if (!match) return null;
        
        const n = match[1] ? parseInt(match[1], 10) : 1;
        const type = sequence.endsWith('S') ? 'up' : 'down';
        
        return { type, n };
    }
    
    parse(text: string): ANSIToken[] {
        const tokens: ANSIToken[] = [];
        const ansiRegex = /\x1b\[[0-9;]*[A-Za-z]|\x1b\[\?[0-9;]*[hl]|\x1b[78]/g;
        
        let lastIndex = 0;
        let match;
        
        while ((match = ansiRegex.exec(text)) !== null) {
            const startIndex = match.index;
            
            if (startIndex > lastIndex) {
                tokens.push({
                    type: 'text',
                    text: text.substring(lastIndex, startIndex)
                });
            }
            
            const fullMatch = match[0];
            
            if (fullMatch === '\x1b7') {
                tokens.push({ type: 'cursor', cursorAction: { type: 'save' } });
            } else if (fullMatch === '\x1b8') {
                tokens.push({ type: 'cursor', cursorAction: { type: 'restore' } });
            } else if (fullMatch.startsWith('\x1b[?')) {
                const params = fullMatch.slice(3);
                const lastChar = params.slice(-1);
                const num = params.slice(0, -1);
                
                if (num === '25') {
                    if (lastChar === 'h') {
                        tokens.push({ type: 'cursor-show' });
                    } else if (lastChar === 'l') {
                        tokens.push({ type: 'cursor-hide' });
                    }
                }
            } else if (fullMatch.startsWith('\x1b[')) {
                const params = fullMatch.slice(2);
                const lastChar = params.slice(-1);
                const codes = params.slice(0, -1);
                
                if (lastChar === 'm') {
                    tokens.push({ type: 'sgr', style: this.parseSGR(codes) });
                } else if (lastChar === 'H' || lastChar === 'f') {
                    const action = this.parseCursorPosition(codes + lastChar);
                    if (action) tokens.push({ type: 'cursor', cursorAction: action });
                } else if (lastChar === 's') {
                    tokens.push({ type: 'cursor', cursorAction: { type: 'save' } });
                } else if (lastChar === 'u') {
                    tokens.push({ type: 'cursor', cursorAction: { type: 'restore' } });
                } else if (lastChar === 'J' || lastChar === 'K') {
                    const action = this.parseClear(codes + lastChar);
                    if (action) tokens.push({ type: 'clear', clearAction: action });
                } else if (lastChar === 'S' || lastChar === 'T') {
                    const action = this.parseScroll(codes + lastChar);
                    if (action) tokens.push({ type: 'scroll', scrollAction: action });
                } else if ('ABCDG'.includes(lastChar)) {
                    const action = this.parseCursorMove(codes + lastChar);
                    if (action) tokens.push({ type: 'cursor', cursorAction: action });
                }
            }
            
            lastIndex = ansiRegex.lastIndex;
        }
        
        if (lastIndex < text.length) {
            tokens.push({
                type: 'text',
                text: text.substring(lastIndex)
            });
        }
        
        return tokens;
    }
    
    stripANSI(text: string): string {
        return text.replace(/\x1b\[[0-9;]*[A-Za-z]|\x1b\[\?[?!]?\d*[A-Za-z]|\x1b[78]/g, '');
    }
}