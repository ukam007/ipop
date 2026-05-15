const fs = require('fs');
const path = require('path');

console.log('\n========================================');
console.log('   IPOP Extension Module Unit Tests');
console.log('========================================\n');

let passed = 0;
let failed = 0;

function logTest(name, pass, details = '') {
    const status = pass ? 'PASS' : 'FAIL';
    console.log(`[${status}] ${name}${details ? ` - ${details}` : ''}`);
    if (pass) passed++;
    else failed++;
}

// Test 1: Package.json validation
try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    logTest('Package.json exists', true);
    logTest('Package name valid', pkg.name === 'ipop-telnet');
    logTest('VSCode engine specified', pkg.engines && pkg.engines.vscode);
    logTest('Main entry defined', pkg.main === './out/extension.js');
    logTest('Commands registered', pkg.contributes && pkg.contributes.commands && pkg.contributes.commands.length > 0);
    logTest('Views registered', pkg.contributes && pkg.contributes.views);
    logTest('Menus configured', pkg.contributes && pkg.contributes.menus);
    logTest('Configuration defined', pkg.contributes && pkg.contributes.configuration);
    logTest('Keybindings defined', pkg.contributes && pkg.contributes.keybindings);
    logTest('Dependencies present', pkg.dependencies && pkg.dependencies['fuse.js'] && pkg.dependencies['iconv-lite']);
} catch (err) {
    logTest('Package.json validation', false, err.message);
}

// Test 2: TypeScript compilation output
try {
    const outDir = fs.readdirSync('out');
    logTest('Out directory exists', true);
    logTest('Extension.js compiled', fs.existsSync('out/extension.js'));
    logTest('Commands compiled', fs.existsSync('out/commands/index.js'));
    logTest('Completion compiled', fs.existsSync('out/completion/indexer.js'));
    logTest('Telnet compiled', fs.existsSync('out/telnet/client.js'));
    logTest('Terminal compiled', fs.existsSync('out/terminal/manager.js'));
    logTest('Config compiled', fs.existsSync('out/config/store.js'));
    logTest('Sidebar compiled', fs.existsSync('out/sidebar/provider.js'));
    logTest('Types compiled', fs.existsSync('out/types/index.js'));
} catch (err) {
    logTest('TypeScript output validation', false, err.message);
}

// Test 3: Source files structure
try {
    const srcFiles = [
        'src/extension.ts',
        'src/types/index.ts',
        'src/telnet/client.ts',
        'src/terminal/manager.ts',
        'src/config/store.ts',
        'src/sidebar/provider.ts',
        'src/sidebar/item.ts',
        'src/commands/index.ts',
        'src/commands/shortcuts.ts',
        'src/completion/provider.ts',
        'src/completion/indexer.ts',
        'src/completion/parser.ts',
        'src/completion/fuzzy.ts',
        'src/completion/symbols.ts'
    ];
    
    srcFiles.forEach(file => {
        logTest(`Source file: ${file}`, fs.existsSync(file));
    });
} catch (err) {
    logTest('Source files validation', false, err.message);
}

// Test 4: VSIX package
try {
    logTest('VSIX package exists', fs.existsSync('ipop-telnet-1.0.0.vsix'));
    const stats = fs.statSync('ipop-telnet-1.0.0.vsix');
    logTest('VSIX size valid', stats.size > 300000 && stats.size < 400000);
} catch (err) {
    logTest('VSIX validation', false, err.message);
}

// Test 5: Resources
try {
    logTest('Resources directory', fs.existsSync('resources'));
    logTest('Icon file', fs.existsSync('resources/icon.svg'));
} catch (err) {
    logTest('Resources validation', false, err.message);
}

// Test 6: Configuration files
try {
    logTest('tsconfig.json', fs.existsSync('tsconfig.json'));
    logTest('.gitignore', fs.existsSync('.gitignore'));
    logTest('.vscodeignore', fs.existsSync('.vscodeignore'));
    logTest('readme.md', fs.existsSync('readme.md'));
    logTest('.vscode/launch.json', fs.existsSync('.vscode/launch.json'));
    logTest('.vscode/tasks.json', fs.existsSync('.vscode/tasks.json'));
} catch (err) {
    logTest('Config files validation', false, err.message);
}

// Test 7: Telnet Client module validation (code inspection)
try {
    const clientCode = fs.readFileSync('src/telnet/client.ts', 'utf8');
    
    logTest('Telnet IAC handling', clientCode.includes('IAC') && clientCode.includes('0xFF'));
    logTest('Telnet WILL/WONT', clientCode.includes('WILL') && clientCode.includes('WONT'));
    logTest('Telnet DO/DONT', clientCode.includes('DO') && clientCode.includes('DONT'));
    logTest('Encoding support', clientCode.includes('iconv'));
    logTest('Connect method', clientCode.includes('connect()'));
    logTest('Disconnect method', clientCode.includes('disconnect()'));
    logTest('Send method', clientCode.includes('send('));
    logTest('Error handling', clientCode.includes('onError'));
} catch (err) {
    logTest('Telnet client code validation', false, err.message);
}

// Test 8: Terminal Manager validation
try {
    const terminalCode = fs.readFileSync('src/terminal/manager.ts', 'utf8');
    
    logTest('Pseudoterminal implemented', terminalCode.includes('Pseudoterminal'));
    logTest('WriteEmitter defined', terminalCode.includes('writeEmitter'));
    logTest('HandleInput method', terminalCode.includes('handleInput'));
    logTest('Input buffer', terminalCode.includes('inputBuffer'));
    logTest('Reconnect logic', terminalCode.includes('reconnect'));
    logTest('Status tracking', terminalCode.includes('status'));
} catch (err) {
    logTest('Terminal manager code validation', false, err.message);
}

// Test 9: Completion module validation
try {
    const indexerCode = fs.readFileSync('src/completion/indexer.ts', 'utf8');
    const parserCode = fs.readFileSync('src/completion/parser.ts', 'utf8');
    const fuzzyCode = fs.readFileSync('src/completion/fuzzy.ts', 'utf8');
    
    logTest('Symbol indexer class', indexerCode.includes('SymbolIndexer'));
    logTest('Index all method', indexerCode.includes('indexAll'));
    logTest('Search method', indexerCode.includes('search'));
    logTest('Fuzzy search usage', indexerCode.includes('FuzzySearcher'));
    
    logTest('C/C++ parser class', parserCode.includes('CCppParser'));
    logTest('Function regex', parserCode.includes('FUNC_REGEX'));
    logTest('Class regex', parserCode.includes('CLASS_REGEX'));
    logTest('Macro regex', parserCode.includes('MACRO_REGEX'));
    logTest('Directory parser', parserCode.includes('parseDirectory'));
    
    logTest('Fuse.js usage', fuzzyCode.includes('Fuse'));
    logTest('Threshold configured', fuzzyCode.includes('threshold'));
    logTest('Include score', fuzzyCode.includes('includeScore'));
} catch (err) {
    logTest('Completion module validation', false, err.message);
}

// Test 10: Commands registration validation
try {
    const commandsCode = fs.readFileSync('src/commands/index.ts', 'utf8');
    
    logTest('NewConnection command', commandsCode.includes('ipop.newConnection'));
    logTest('Connect command', commandsCode.includes('ipop.connect'));
    logTest('Disconnect command', commandsCode.includes('ipop.disconnect'));
    logTest('EditConnection command', commandsCode.includes('ipop.editConnection'));
    logTest('DeleteConnection command', commandsCode.includes('ipop.deleteConnection'));
    logTest('AddShortcut command', commandsCode.includes('ipop.addShortcut'));
    logTest('Completion.addSource', commandsCode.includes('ipop.completion.addSource'));
    logTest('Completion.removeSource', commandsCode.includes('ipop.completion.removeSource'));
    logTest('Completion.refreshIndex', commandsCode.includes('ipop.completion.refreshIndex'));
    logTest('registerCommands function', commandsCode.includes('registerCommands'));
} catch (err) {
    logTest('Commands registration validation', false, err.message);
}

// Test 11: Config store validation
try {
    const storeCode = fs.readFileSync('src/config/store.ts', 'utf8');
    
    logTest('ConfigStore class', storeCode.includes('ConfigStore'));
    logTest('globalState usage', storeCode.includes('globalState'));
    logTest('Connections key', storeCode.includes('ipop.connections'));
    logTest('Shortcuts key', storeCode.includes('ipop.shortcuts'));
    logTest('Sources key', storeCode.includes('ipop.completionSources'));
    logTest('CRUD methods', 
        storeCode.includes('addConnection') && 
        storeCode.includes('deleteConnection') &&
        storeCode.includes('updateConnection'));
} catch (err) {
    logTest('Config store validation', false, err.message);
}

// Test 12: Extension entry point validation
try {
    const extCode = fs.readFileSync('src/extension.ts', 'utf8');
    
    logTest('activate function', extCode.includes('function activate'));
    logTest('deactivate function', extCode.includes('function deactivate'));
    logTest('Config store init', extCode.includes('initConfigStore'));
    logTest('Providers init', extCode.includes('initProviders'));
    logTest('Commands register', extCode.includes('registerCommands'));
    logTest('Symbol indexer init', extCode.includes('getSymbolIndexer'));
} catch (err) {
    logTest('Extension entry validation', false, err.message);
}

console.log('\n========================================');
console.log('   Unit Test Summary');
console.log('========================================');
console.log(`Total: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Success: ${((passed/(passed+failed))*100).toFixed(1)}%`);

if (failed > 0) {
    process.exit(1);
} else {
    console.log('\n✅ All module tests passed!\n');
    process.exit(0);
}