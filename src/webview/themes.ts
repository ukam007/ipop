export interface TerminalTheme {
    name: string;
    id: string;
    background: string;
    foreground: string;
    cursor: string;
    selection: string;
    highlight: string;
    colors: {
        black: string;
        red: string;
        green: string;
        yellow: string;
        blue: string;
        magenta: string;
        cyan: string;
        white: string;
    };
}

export const predefinedThemes: TerminalTheme[] = [
    {
        name: 'Dark (Default)',
        id: 'dark',
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        selection: '#264f78',
        highlight: '#ffd700',
        colors: {
            black: '#000000',
            red: '#cd3131',
            green: '#0dbc79',
            yellow: '#e5e510',
            blue: '#2472c8',
            magenta: '#bc3fbc',
            cyan: '#11a8cd',
            white: '#e5e5e5'
        }
    },
    {
        name: 'Light',
        id: 'light',
        background: '#ffffff',
        foreground: '#000000',
        cursor: '#000000',
        selection: '#add6ff',
        highlight: '#ffd700',
        colors: {
            black: '#000000',
            red: '#cd3131',
            green: '#00bc00',
            yellow: '#949800',
            blue: '#0451a5',
            magenta: '#bc05bc',
            cyan: '#0598bc',
            white: '#555555'
        }
    },
    {
        name: 'Solarized Dark',
        id: 'solarized-dark',
        background: '#002b36',
        foreground: '#839496',
        cursor: '#839496',
        selection: '#073642',
        highlight: '#b58900',
        colors: {
            black: '#073642',
            red: '#dc322f',
            green: '#859900',
            yellow: '#b58900',
            blue: '#268bd2',
            magenta: '#d33682',
            cyan: '#2aa198',
            white: '#eee8d5'
        }
    },
    {
        name: 'Monokai',
        id: 'monokai',
        background: '#272822',
        foreground: '#f8f8f2',
        cursor: '#f8f8f0',
        selection: '#49483e',
        highlight: '#e6db74',
        colors: {
            black: '#272822',
            red: '#f92672',
            green: '#a6e22e',
            yellow: '#e6db74',
            blue: '#66d9ef',
            magenta: '#fd5ff0',
            cyan: '#a1efe4',
            white: '#f8f8f2'
        }
    },
    {
        name: 'High Contrast',
        id: 'high-contrast',
        background: '#000000',
        foreground: '#ffffff',
        cursor: '#ffffff',
        selection: '#ffffff',
        highlight: '#ffff00',
        colors: {
            black: '#000000',
            red: '#ff0000',
            green: '#00ff00',
            yellow: '#ffff00',
            blue: '#0000ff',
            magenta: '#ff00ff',
            cyan: '#00ffff',
            white: '#ffffff'
        }
    }
];

export function getThemeById(id: string): TerminalTheme | undefined {
    return predefinedThemes.find(theme => theme.id === id);
}

export function getThemeCSS(theme: TerminalTheme): string {
    return `
        :root {
            --background: ${theme.background};
            --foreground: ${theme.foreground};
            --cursor: ${theme.cursor};
            --selection: ${theme.selection};
            --highlight: ${theme.highlight};
            --color-black: ${theme.colors.black};
            --color-red: ${theme.colors.red};
            --color-green: ${theme.colors.green};
            --color-yellow: ${theme.colors.yellow};
            --color-blue: ${theme.colors.blue};
            --color-magenta: ${theme.colors.magenta};
            --color-cyan: ${theme.colors.cyan};
            --color-white: ${theme.colors.white};
        }
        
        body {
            background: var(--background);
            color: var(--foreground);
        }
        
        .status-bar,
        .output-toolbar,
        .filter-container,
        .terminal-input {
            background: color-mix(in srgb, var(--background) 90%, var(--foreground) 10%);
        }
        
        .search-input,
        .filter-input,
        .filter-select,
        .toolbar-button,
        .input-area {
            background: color-mix(in srgb, var(--background) 80%, var(--foreground) 20%);
            color: var(--foreground);
        }
        
        .highlight,
        .highlight-filter {
            background: var(--highlight);
            color: var(--background);
        }
    `;
}