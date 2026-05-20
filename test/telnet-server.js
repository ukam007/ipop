const net = require('net');

const PORT = 2323;
const HOST = '127.0.0.1';
const PROMPT = 'attach_to_123$ ';

const commands = {
    'help': () => 
        `Available commands:
  help        - Show this help
  pwd         - Print working directory
  ls          - List files
  cd          - Change directory
  cat         - View file content
  whoami      - Show current user
  uname       - System information
  date        - Show date/time
  uptime      - Show uptime
  free        - Memory usage
  df          - Disk usage
  ps          - Process list
  top         - Top processes
  ifconfig    - Network interfaces
  ping        - Ping test
  route       - Routing table
  netstat     - Network statistics
  iptables    - Firewall rules
  reboot      - Reboot system
  shutdown    - Shutdown system
  exit        - Exit session
`,
    'pwd': () => '/root\r\n',
    'ls': () => `bin  boot  dev  etc  home  lib  lib64  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var\r\n`,
    'ls -la': () => `total 64
drwxr-xr-x  18 root root  4096 Jan  1 00:00 .
drwxr-xr-x  18 root root  4096 Jan  1 00:00 ..
drwxr-xr-x   2 root root  4096 Jan  1 00:00 bin
drwxr-xr-x   4 root root  4096 Jan  1 00:00 boot
drwxr-xr-x  15 root root  4096 Jan  1 00:00 dev
drwxr-xr-x  86 root root  4096 Jan  1 00:00 etc
\r\n`,
    'cd': () => '',
    'cd ~': () => '',
    'cd /': () => '',
    'whoami': () => 'root\r\n',
    'uname': () => 'Linux\r\n',
    'uname -a': () => 'Linux attach_to_123 5.4.0-generic #1 SMP Jan 1 00:00:00 UTC 2026 x86_64 GNU/Linux\r\n',
    'date': () => `${new Date().toISOString()}\r\n`,
    'uptime': () => ' 00:00:01 up 1 day, 1 user, load average: 0.00, 0.01, 0.05\r\n',
    'free': () => `              total        used        free      shared  buff/cache   available
Mem:           2048         512        1024           0         512        1536
Swap:          1024           0        1024
\r\n`,
    'df': () => `Filesystem     1K-blocks    Used Available Use% Mounted on
/dev/sda1        20480000 5120000  15360000  25% /
tmpfs              512000       0    512000   0% /tmp
\r\n`,
    'df -h': () => `Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1       20G   5G   15G  25% /
tmpfs           500M     0  500M   0% /tmp
\r\n`,
    'ps': () => `  PID TTY          TIME CMD
    1 pts/0    00:00:00 bash
   10 pts/0    00:00:00 ps
\r\n`,
    'top': () => `top - 00:00:01 up 1 day, 1 user, load average: 0.00, 0.01, 0.05
Tasks:   2 total,   1 running,   1 sleeping,   0 stopped,   0 zombie
%Cpu(s):  0.0 us,  0.0 sy,  0.0 ni, 100.0 id,  0.0 wa,  0.0 hi,  0.0 si
KiB Mem :  2048000 total,  1024000 free,   512000 used,   512000 buff/cache
\r\n`,
    'ifconfig': () => `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.1.100  netmask 255.255.255.0  broadcast 192.168.1.255
        inet6 fe80::1  prefixlen 64  scopeid 0x20<link>
        ether 00:11:22:33:44:55  txqueuelen 1000  (Ethernet)
        RX packets 1000  bytes 65536 (64.0 KiB)
        TX packets 500  bytes 32768 (32.0 KiB)

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
\r\n`,
    'ping': () => 'PING 127.0.0.1 (127.0.0.1): 56 data bytes\r\n64 bytes from 127.0.0.1: seq=0 ttl=64 time=0.1 ms\r\n\r\n--- 127.0.0.1 ping statistics ---\r\n1 packets transmitted, 1 packets received, 0% packet loss\r\n',
    'ping 8.8.8.8': () => 'PING 8.8.8.8 (8.8.8.8): 56 data bytes\r\n64 bytes from 8.8.8.8: seq=0 ttl=64 time=10.5 ms\r\n\r\n--- 8.8.8.8 ping statistics ---\r\n1 packets transmitted, 1 packets received, 0% packet loss\r\n',
    'route': () => `Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
default         192.168.1.1     0.0.0.0         UG    100    0        0 eth0
192.168.1.0     0.0.0.0         255.255.255.0   U     100    0        0 eth0
\r\n`,
    'netstat': () => `Active Internet connections
Proto Recv-Q Send-Q Local Address           Foreign Address         State
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.1:2323          127.0.0.1:*             ESTABLISHED
\r\n`,
    'iptables': () => `Chain INPUT (policy ACCEPT)
target     prot opt source               destination
ACCEPT     tcp  --  anywhere             anywhere             tcp dpt:22
ACCEPT     tcp  --  anywhere             anywhere             tcp dpt:2323

Chain FORWARD (policy ACCEPT)
target     prot opt source               destination

Chain OUTPUT (policy ACCEPT)
target     prot opt source               destination
\r\n`,
    'cat /etc/hostname': () => 'attach_to_123\r\n',
    'cat /etc/passwd': () => 'root:x:0:0:root:/root:/bin/bash\r\n',
    'echo': (args) => (args.join(' ') || '') + '\r\n',
    'reboot': (client) => {
        client.write('System rebooting...\r\n');
        setTimeout(() => client.end(), 500);
        return '';
    },
    'shutdown': (client) => {
        client.write('System shutting down...\r\n');
        setTimeout(() => client.end(), 500);
        return '';
    },
    'exit': (client) => {
        client.write('Goodbye!\r\n');
        client.end();
        return '';
    }
};

function handleCommand(data, client) {
    const trimmed = data.trim();
    if (!trimmed) return '';
    
    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    if (commands[cmd + ' ' + args[0]]) {
        return commands[cmd + ' ' + args[0]](args.slice(1));
    }
    
    if (commands[cmd]) {
        const result = commands[cmd](args, client);
        if (result === undefined) return '';
        return result;
    }
    
    return `${trimmed}: command not found\r\n`;
}

const server = net.createServer((client) => {
    server.connections = (server.connections || 0) + 1;
    
    console.log(`Client connected from ${client.remoteAddress}:${client.remotePort}`);
    
    client.write(`\r\n`);
    client.write(`Last login: ${new Date().toISOString()} from ${client.remoteAddress}\r\n`);
    client.write(`\r\n`);
    client.write(PROMPT);
    
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
                    client.write(cmd + '\r\n');
                    const response = handleCommand(cmd, client);
                    if (response) {
                        client.write(response);
                    }
                }
                client.write(PROMPT);
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