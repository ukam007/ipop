import { StyleState, createDefaultStyle } from './ansi';

export class StyleManager {
    private currentStyle: StyleState;
    
    constructor() {
        this.currentStyle = createDefaultStyle();
    }
    
    applyStyle(style: Partial<StyleState>): void {
        Object.assign(this.currentStyle, style);
    }
    
    reset(): void {
        this.currentStyle = createDefaultStyle();
    }
    
    getCurrentStyle(): StyleState {
        return { ...this.currentStyle };
    }
    
    toCSSString(): string {
        const parts: string[] = [];
        
        if (this.currentStyle.fgColor) {
            parts.push(`color: ${this.currentStyle.fgColor}`);
        }
        
        if (this.currentStyle.bgColor) {
            parts.push(`background: ${this.currentStyle.bgColor}`);
        }
        
        if (this.currentStyle.bold) {
            parts.push('font-weight: bold');
        }
        
        if (this.currentStyle.dim) {
            parts.push('opacity: 0.5');
        }
        
        if (this.currentStyle.italic) {
            parts.push('font-style: italic');
        }
        
        if (this.currentStyle.underline) {
            parts.push('text-decoration: underline');
        }
        
        if (this.currentStyle.strikethrough) {
            if (this.currentStyle.underline) {
                parts.push('text-decoration: underline line-through');
            } else {
                parts.push('text-decoration: line-through');
            }
        }
        
        if (this.currentStyle.inverse) {
            parts.push('filter: invert(1)');
        }
        
        if (this.currentStyle.hidden) {
            parts.push('visibility: hidden');
        }
        
        return parts.join('; ');
    }
    
    wrapText(text: string): string {
        const css = this.toCSSString();
        
        if (css) {
            return `<span style="${css}">${this.escapeHtml(text)}</span>`;
        }
        
        return this.escapeHtml(text);
    }
    
    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
    
    hasStyle(): boolean {
        return this.currentStyle.fgColor !== null ||
               this.currentStyle.bgColor !== null ||
               this.currentStyle.bold ||
               this.currentStyle.dim ||
               this.currentStyle.italic ||
               this.currentStyle.underline ||
               this.currentStyle.blink ||
               this.currentStyle.inverse ||
               this.currentStyle.hidden ||
               this.currentStyle.strikethrough;
    }
}