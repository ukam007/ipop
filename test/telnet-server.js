const net = require('net');

const PORT = 2323;
const HOST = '127.0.0.1';

const commands = {
    'help': () => 
        `Available commands:
  help     - Show this help
  echo     - Echo back your message
  status   - Show server status
  time     - Show current time
  repeat   - Repeat message (repeat <n> <msg>)
  clear    - Clear screen
  quit     - Disconnect
  login    - Simulate login (login <user> <pass>)
  ping     - Test connection
  chinese  - Test Chinese encoding
`,
    'status': () => 
        `Server Status:
  Host: ${HOST}
  Port: ${PORT}
  Connections: ${server.connections || 0}
  Uptime: ${process.uptime().toFixed(2)}s
`,
    'time': () => `Current time: ${new Date().toISOString()}`,
    'ping': () => 'PONG!',
    'chinese': () => '中文测试: 你好世界！Hello World!',
    'clear': () => '\x1b[2J\x1b[H',
    'quit': (client) => {
        client.write('Goodbye!\r\n');
        client.end();
        return '';
    },
    'login': (client, args) => {
        const user = args[1] || 'guest';
        const pass = args[2] || '';
        client.write(`Login attempt: user=${user}, pass=${pass ? '****' : 'none'}\r\n`);
        if (user === 'admin' && pass === 'admin') {
            return 'Login successful! Welcome admin.\r\n';
        }
        return 'Login failed. Use: login admin admin\r\n';
    }
};

function handleCommand(data, client) {
    const trimmed = data.trim();
    if (!trimmed) return '';
    
    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    if (cmd === 'echo') {
        return (args.join(' ') || '(empty)') + '\r\n';
    }
    
    if (cmd === 'repeat') {
        const n = parseInt(args[0]) || 1;
        const msg = args.slice(1).join(' ') || 'repeat';
        let result = '';
        for (let i = 0; i < Math.min(n, 10); i++) {
            result += `${i+1}: ${msg}\r\n`;
        }
        return result;
    }
    
    if (commands[cmd]) {
        const result = commands[cmd](client, args);
        if (result === undefined) return '';
        return result;
    }
    
    return `Unknown command: ${cmd}. Type 'help' for available commands.\r\n`;
}

const server = net.createServer((client) => {
    server.connections = (server.connections || 0) + 1;
    
    console.log(`Client connected from ${client.remoteAddress}:${client.remotePort}`);
    
    client.write(`\r\n`);
    client.write(`=================================\r\n`);
    client.write(`   IPOP Test Telnet Server\r\n`);
    client.write(`=================================\r\n`);
    client.write(`\r\n`);
    client.write(`Welcome! Type 'help' for commands.\r\n`);
    client.write(`\r\n`);
    client.write(`${HOST}:${PORT}> `);
    
    let buffer = '';
    
    client.on('data', (data) => {
        const str = data.toString();
        
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            const code = str.charCodeAt(i);
            
            if (code === 13) {
                const cmd = buffer;
                buffer = '';
                
                if (cmd.trim()) {
                    console.log(`Command: ${cmd}`);
                    const response = handleCommand(cmd, client);
                    if (response) {
                        client.write(response);
                    }
                }
                client.write(`${HOST}:${PORT}> `);
            } else if (code === 10) {
            } else if (code === 127 || code === 8) {
                if (buffer.length > 0) {
                    buffer = buffer.slice(0, -1);
                    client.write('\b \b');
                }
            } else if (code === 255) {
                i += 2;
            } else if (code >= 32) {
                buffer += char;
                client.write(char);
            }
        }
    });
    
    client.on('end', () => {
        console.log('Client disconnected');
        server.connections--;
    });
    
    client.on('error', (err) => {
        console.log('Client error:', err.message);
    });
});

server.listen(PORT, HOST, () => {
    console.log(`Telnet server running on ${HOST}:${PORT}`);
    console.log('Test with: telnet 127.0.0.1 2323');
    console.log('Or use IPOP extension in VSCode');
});

process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    server.close();
    process.exit(0);
});