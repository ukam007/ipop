const net = require('net');
const iconv = require('iconv-lite');

const PORT = 2323;
const HOST = '127.0.0.1';
const ENCODING = 'utf-8';
const PROMPT = 'attach_to_123$ ';

function encodeResponse(text) {
    return iconv.encode(text, ENCODING);
}

const commands = {
    'help': () => encodeResponse('Available commands:\r\n' +
        '  help        - Show this help\r\n' +
        '  pwd         - Print working directory\r\n' +
        '  ls          - List files\r\n' +
        '  whoami      - Show current user\r\n' +
        '  uname       - System information\r\n' +
        '  date        - Show date/time\r\n' +
        '  uptime      - Show uptime\r\n' +
        '  free        - Memory usage\r\n' +
        '  df          - Disk usage\r\n' +
        '  ps          - Process list\r\n' +
        '  ifconfig    - Network interfaces\r\n' +
        '  ping        - Ping test\r\n' +
        '  route       - Routing table\r\n' +
        '  netstat     - Network statistics\r\n' +
        '  iptables    - Firewall rules\r\n' +
        '  exit        - Exit session\r\n'),
    'pwd': () => encodeResponse('/root\r\n'),
    'ls': () => encodeResponse('bin  boot  dev  etc  home  lib  lib64  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var\r\n'),
    'ls -la': () => encodeResponse('total 64\r\n' +
        'drwxr-xr-x  18 root root  4096 Jan  1 00:00 .\r\n' +
        'drwxr-xr-x  18 root root  4096 Jan  1 00:00 ..\r\n' +
        'drwxr-xr-x   2 root root  4096 Jan  1 00:00 bin\r\n' +
        'drwxr-xr-x   4 root root  4096 Jan  1 00:00 boot\r\n'),
    'whoami': () => encodeResponse('root\r\n'),
    'uname': () => encodeResponse('Linux\r\n'),
    'uname -a': () => encodeResponse('Linux attach_to_123 5.4.0-generic #1 SMP x86_64 GNU/Linux\r\n'),
    'date': () => encodeResponse(`${new Date().toISOString()}\r\n`),
    'uptime': () => encodeResponse(' 00:00:01 up 1 day, 1 user, load average: 0.00, 0.01, 0.05\r\n'),
    'free': () => encodeResponse('              total        used        free\r\n' +
        'Mem:           2048         512        1024\r\n' +
        'Swap:          1024           0        1024\r\n'),
    'df': () => encodeResponse('Filesystem     1K-blocks    Used Available\r\n' +
        '/dev/sda1        20480000 5120000  15360000\r\n'),
    'df -h': () => encodeResponse('Filesystem      Size  Used Avail\r\n' +
        '/dev/sda1       20G   5G   15G\r\n'),
    'ps': () => encodeResponse('  PID TTY          TIME CMD\r\n' +
        '    1 pts/0    00:00:00 bash\r\n'),
    'ifconfig': () => encodeResponse('eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\r\n' +
        '        inet 192.168.1.100  netmask 255.255.255.0\r\n' +
        '        ether 00:11:22:33:44:55\r\n' +
        'lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536\r\n' +
        '        inet 127.0.0.1  netmask 255.0.0.0\r\n'),
    'ping': () => encodeResponse('PING 127.0.0.1: 56 data bytes\r\n' +
        '64 bytes from 127.0.0.1: time=0.1 ms\r\n'),
    'ping 8.8.8.8': () => encodeResponse('PING 8.8.8.8: 56 data bytes\r\n' +
        '64 bytes from 8.8.8.8: time=10.5 ms\r\n'),
    'route': () => encodeResponse('Kernel IP routing table\r\n' +
        'Destination     Gateway         Genmask         Iface\r\n' +
        'default         192.168.1.1     0.0.0.0         eth0\r\n'),
    'netstat': () => encodeResponse('Active Internet connections\r\n' +
        'Proto Recv-Q Send-Q Local Address   Foreign Address  State\r\n' +
        'tcp        0      0 0.0.0.0:22      0.0.0.0:*        LISTEN\r\n'),
    'iptables': () => encodeResponse('Chain INPUT (policy ACCEPT)\r\n' +
        'target     prot opt source         destination\r\n'),
    'echo': (args) => encodeResponse((args.join(' ') || '') + '\r\n'),
    'clear': () => Buffer.from('\x1b[2J\x1b[H'),
    'exit': (client) => {
        client.write(encodeResponse('Goodbye!\r\n'));
        client.end();
        return null;
    }
};

function handleCommand(data, client) {
    const trimmed = data.trim();
    if (!trimmed) return null;

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    const fullCmd = cmd + ' ' + args[0];
    if (commands[fullCmd]) {
        return commands[fullCmd](args.slice(1));
    }

    if (commands[cmd]) {
        const response = commands[cmd](args, client);
        return response;
    }
    
    return encodeResponse(`${trimmed}: command not found\r\n`);
}

const server = net.createServer((client) => {
    server.connections = (server.connections || 0) + 1;
    
    console.log(`Client connected from ${client.remoteAddress}:${client.remotePort}`);
    
    client.write(encodeResponse('\r\n'));
    client.write(encodeResponse(`Last login: ${new Date().toISOString()} from ${client.remoteAddress}\r\n`));
    client.write(encodeResponse('\r\n'));
    client.write(encodeResponse(PROMPT));

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
                    client.write(encodeResponse(cmd + '\r\n'));
                    const response = handleCommand(cmd, client);
                    if (response) {
                        client.write(response);
                    }
                    client.write(encodeResponse(PROMPT));
                } else {
                    client.write(encodeResponse(PROMPT));
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