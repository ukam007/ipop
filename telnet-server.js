const net = require('net');
const iconv = require('iconv-lite');

const PORT = 2323;
const HOST = '127.0.0.1';
const ENCODING = 'utf-8';

function encodeResponse(text) {
    return iconv.encode(text, ENCODING);
}

const commands = {
    'help': () => encodeResponse('Available commands:\r\n' +
        '  help     - Show this help\r\n' +
        '  echo     - Echo back message\r\n' +
        '  status   - Show server status\r\n' +
        '  time     - Show current time\r\n' +
        '  repeat   - Repeat message (repeat <n> <message>)\r\n' +
        '  clear    - Clear screen\r\n' +
        '  quit     - Disconnect\r\n' +
        '  login    - Simulate login (login <user> <pass>)\r\n' +
        '  ping     - Test connection\r\n' +
        '  chinese  - Test Chinese encoding\r\n'),
    'status': () => encodeResponse('Server Status:\r\n' +
        `  Host: ${HOST}\r\n` +
        `  Port: ${PORT}\r\n` +
        `  Connections: ${server.connections || 0}\r\n` +
        `  Uptime: ${process.uptime().toFixed(2)}s\r\n`),
    'time': () => encodeResponse(`Current time: ${new Date().toISOString()}\r\n`),
    'ping': () => encodeResponse('PONG!\r\n'),
    'chinese': () => encodeResponse('中文测试: 你好世界 Hello World 中文支持\r\n'),
    'clear': () => Buffer.from('\x1b[2J\x1b[H'),
    'quit': (client) => {
        client.write(encodeResponse('Goodbye!\r\n'));
        client.end();
        return null;
    },
    'login': (client, args) => {
        const user = args[0] || 'guest';
        const pass = args[1] || '';
        client.write(encodeResponse(`Login attempt: user=${user}, pass=${pass ? 'provided' : 'empty'}\r\n`));
        if (user === 'admin' && pass === 'admin') {
            client.write(encodeResponse('Login successful! Welcome admin.\r\n'));
        } else {
            client.write(encodeResponse('Login failed. Use: login admin admin\r\n'));
        }
        return null;
    }
};

function handleCommand(data, client) {
    const trimmed = data.trim();
    if (!trimmed) return null;

    const parts = trimmed.split(/\s+/);
    const originalCmd = parts[0];
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (cmd === 'echo') {
        return encodeResponse((args.join(' ') || '(empty)') + '\r\n');
    }
    
    if (cmd === 'repeat') {
        const count = parseInt(args[0]) || 1;
        const msg = args.slice(1).join(' ') || 'repeat test';
        let result = '';
        for (let i = 0; i < Math.min(count, 10); i++) {
            result += `${i+1}: ${msg}\r\n`;
        }
        return encodeResponse(result);
    }

    if (commands[cmd]) {
        const response = commands[cmd](client, args);
        return response;
    }
    
    return encodeResponse(`Unknown command: ${originalCmd}. Type 'help' for available commands.\r\n`);
}

const server = net.createServer((client) => {
    server.connections = (server.connections || 0) + 1;
    
    console.log(`Client connected from ${client.remoteAddress}:${client.remotePort}`);
    
    client.write(encodeResponse('\r\n================================\r\n'));
    client.write(encodeResponse('   IPOP Telnet Test Server\r\n'));
    client.write(encodeResponse('================================\r\n\r\n'));
    client.write(encodeResponse('Welcome! Type "help" for commands.\r\n\r\n'));
    client.write(encodeResponse(`${HOST}:${PORT}> `));

    let buffer = Buffer.alloc(0);
    
    client.on('data', (data) => {
        buffer = Buffer.concat([buffer, data]);
        
        for (let i = 0; i < buffer.length; i++) {
            const byte = buffer[i];
            
            if (byte === 13) { // CR
                const cmdBuffer = buffer.slice(0, i);
                const cmd = iconv.decode(cmdBuffer, ENCODING);
                buffer = buffer.slice(i + 1);
                
                // Skip LF if present
                if (buffer.length > 0 && buffer[0] === 10) {
                    buffer = buffer.slice(1);
                }
                
                if (cmd.trim()) {
                    console.log(`Command received: "${cmd.trim()}"`);
                    const response = handleCommand(cmd, client);
                    if (response) {
                        client.write(response);
                    }
                    client.write(encodeResponse(`${HOST}:${PORT}> `));
                } else {
                    client.write(encodeResponse(`${HOST}:${PORT}> `));
                }
                i = -1; // Reset loop
            } else if (byte === 10) { // LF - skip
                buffer = buffer.slice(1);
                i = -1;
            } else if (byte === 8 || byte === 127) { // Backspace
                if (buffer.length > 1) {
                    buffer = Buffer.concat([buffer.slice(0, i - 1 < 0 ? 0 : i), buffer.slice(i + 1)]);
                    i = Math.max(-1, i - 2);
                } else {
                    buffer = Buffer.alloc(0);
                    i = -1;
                }
            } else if (byte === 255) { // IAC - Telnet protocol
                if (i + 2 < buffer.length) {
                    const iacCmd = buffer[i + 1];
                    if (iacCmd === 253 || iacCmd === 251) { // DO/WILL
                        const option = buffer[i + 2];
                        client.write(Buffer.from([255, 254, option])); // WONT
                        buffer = Buffer.concat([buffer.slice(0, i), buffer.slice(i + 3)]);
                        i = Math.max(-1, i - 1);
                    } else {
                        buffer = Buffer.concat([buffer.slice(0, i), buffer.slice(i + 2)]);
                        i = Math.max(-1, i - 1);
                    }
                }
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
    console.log(`Encoding: ${ENCODING}`);
    console.log('Test with: telnet 127.0.0.1 2323');
    console.log('Or use IPOP extension in VSCode (use UTF-8 encoding)');
});

process.on('SIGINT', () => {
    console.log('\nShutting down...');
    server.close();
    process.exit(0);
});