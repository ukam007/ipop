import * as fs from 'fs';
import * as path from 'path';
import { SymbolInfo, SymbolKind } from '../types';

export class CCppParser {
    private static readonly FUNC_REGEX = /\b(?:[\w\s*]+(?:\s*[*&]+)?\s*)\s+(\w+)\s*\(([^)]*)\)\s*(?:\{|;)/g;
    private static readonly CLASS_REGEX = /\b(?:class|struct)\s+(\w+)\s*(?:\{|;|:)/g;
    private static readonly METHOD_REGEX = /\b(?:virtual\s+)?(?:static\s+)?(?:[\w\s*]+(?:\s*[*&]+)?\s*)\s+(\w+)\s*\(([^)]*)\)\s*(?:const\s*)?(?:\{|;|=)/g;
    private static readonly MACRO_REGEX = /#define\s+(\w+)(?:\(([^)]*)\))?\s+/g;
    private static readonly TYPEDEF_REGEX = /\btypedef\s+.+\s+(\w+)\s*;/g;
    private static readonly ENUM_REGEX = /\benum\s+(\w+)\s*\{/g;
    private static readonly NAMESPACE_REGEX = /\bnamespace\s+(\w+)\s*\{/g;

    parseFile(filePath: string, sourceId: string): SymbolInfo[] {
        const content = fs.readFileSync(filePath, 'utf-8');
        return this.parseContent(content, filePath, sourceId);
    }

    parseContent(content: string, filePath: string, sourceId: string): SymbolInfo[] {
        const symbols: SymbolInfo[] = [];
        const lines = content.split('\n');

        let match;
        
        CCppParser.FUNC_REGEX.lastIndex = 0;
        while ((match = CCppParser.FUNC_REGEX.exec(content)) !== null) {
            const name = match[1];
            const params = match[2];
            if (!this.isKeyword(name) && !this.isBuiltIn(name)) {
                symbols.push(this.createSymbol(
                    name, 'function', filePath, sourceId,
                    lines, match.index,
                    `${name}(${params})`
                ));
            }
        }

        CCppParser.CLASS_REGEX.lastIndex = 0;
        while ((match = CCppParser.CLASS_REGEX.exec(content)) !== null) {
            const name = match[1];
            if (!this.isKeyword(name)) {
                symbols.push(this.createSymbol(
                    name, 'class', filePath, sourceId,
                    lines, match.index,
                    `class/struct ${name}`
                ));
            }
        }

        CCppParser.MACRO_REGEX.lastIndex = 0;
        while ((match = CCppParser.MACRO_REGEX.exec(content)) !== null) {
            const name = match[1];
            const params = match[2];
            symbols.push(this.createSymbol(
                name, 'macro', filePath, sourceId,
                lines, match.index,
                params ? `${name}(${params})` : name
            ));
        }

        CCppParser.TYPEDEF_REGEX.lastIndex = 0;
        while ((match = CCppParser.TYPEDEF_REGEX.exec(content)) !== null) {
            const name = match[1];
            if (!this.isKeyword(name)) {
                symbols.push(this.createSymbol(
                    name, 'typedef', filePath, sourceId,
                    lines, match.index,
                    `typedef ${name}`
                ));
            }
        }

        CCppParser.ENUM_REGEX.lastIndex = 0;
        while ((match = CCppParser.ENUM_REGEX.exec(content)) !== null) {
            const name = match[1];
            symbols.push(this.createSymbol(
                name, 'typedef', filePath, sourceId,
                lines, match.index,
                `enum ${name}`
            ));
        }

        return symbols;
    }

    private createSymbol(
        name: string,
        kind: SymbolKind,
        filePath: string,
        sourceId: string,
        lines: string[],
        index: number,
        detail: string
    ): SymbolInfo {
        const line = this.findLineNumber(lines, index);
        return {
            id: `${sourceId}:${filePath}:${name}:${line}`,
            name,
            kind,
            detail,
            insertText: name,
            filePath,
            line,
            sourceId
        };
    }

    private findLineNumber(lines: string[], index: number): number {
        let currentLength = 0;
        for (let i = 0; i < lines.length; i++) {
            currentLength += lines[i].length + 1;
            if (currentLength > index) {
                return i + 1;
            }
        }
        return 1;
    }

    private isKeyword(name: string): boolean {
        const keywords = [
            'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
            'break', 'continue', 'return', 'goto', 'try', 'catch', 'throw',
            'new', 'delete', 'class', 'struct', 'enum', 'union', 'typedef',
            'const', 'static', 'extern', 'inline', 'virtual', 'override',
            'public', 'private', 'protected', 'friend', 'operator', 'template',
            'typename', 'namespace', 'using', 'sizeof', 'typeof', 'alignof'
        ];
        return keywords.includes(name);
    }

    private isBuiltIn(name: string): boolean {
        const builtins = [
            'main', 'printf', 'scanf', 'malloc', 'free', 'calloc', 'realloc',
            'memcpy', 'memset', 'strcmp', 'strlen', 'strcpy', 'strcat',
            'fopen', 'fclose', 'fread', 'fwrite', 'fgets', 'fputs',
            'exit', 'abort', 'atoi', 'atof', 'itoa'
        ];
        return builtins.includes(name);
    }
}

export function parseDirectory(
    dirPath: string,
    sourceId: string,
    patterns: string[] = ['*.h', '*.hpp', '*.c', '*.cpp', '*.cc', '*.cxx']
): SymbolInfo[] {
    const symbols: SymbolInfo[] = [];
    const parser = new CCppParser();

    const files = findFiles(dirPath, patterns);
    for (const file of files) {
        try {
            const fileSymbols = parser.parseFile(file, sourceId);
            symbols.push(...fileSymbols);
        } catch (error) {
            console.error(`Failed to parse ${file}:`, error);
        }
    }

    return symbols;
}

function findFiles(dirPath: string, patterns: string[]): string[] {
    const files: string[] = [];
    
    if (!fs.existsSync(dirPath)) {
        return files;
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
            files.push(...findFiles(fullPath, patterns));
        } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            const patternExt = patterns.map(p => p.replace('*', '').replace('.', ''));
            if (patternExt.includes(ext.replace('.', ''))) {
                files.push(fullPath);
            }
        }
    }

    return files;
}