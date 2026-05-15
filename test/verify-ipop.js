const net = require('net');
const fs = require('fs');
const path = require('path');

const PORT = 2323;
const HOST = '127.0.0.1';

const validationResults = [];

function log(category, item, status, note = '') {
    validationResults.push({
        category,
        item,
        status,
        note,
        timestamp: new Date().toISOString()
    });
    
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} [${category}] ${item}: ${status}${note ? ` (${note})` : ''}`);
}

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function createClient() {
    return new net.Socket();
}

async function testTelnetConnection() {
    log('Telnet', 'Connection Test', 'RUNNING');
    
    return new Promise((resolve) => {
        const client = createClient();
        let received = '';
        
        client.setTimeout(5000);
        
        client.connect(PORT, HOST, () => {
            log('Telnet', 'TCP Connection', 'PASS', `Connected to ${HOST}:${PORT}`);
        });
        
        client.on('data', (data) => {
            received += data.toString();
            
            if (received.includes('Welcome')) {
                log('Telnet', 'Welcome Message', 'PASS', 'Received welcome banner');
                client.write('help\r\n');
            }
            
            if (received.includes('Available commands')) {
                log('Telnet', 'Command Response', 'PASS', 'help command works');
            }
        });
        
        client.on('error', (err) => {
            log('Telnet', 'Connection', 'FAIL', err.message);
            resolve(false);
        });
        
        client.on('timeout', () => {
            log('Telnet', 'Connection', 'FAIL', 'Timeout');
            client.destroy();
            resolve(false);
        });
        
        setTimeout(() => {
            const passed = received.includes('Welcome') && received.includes('Available commands');
            log('Telnet', 'Overall', passed ? 'PASS' : 'FAIL');
            client.end();
            resolve(passed);
        }, 3000);
    });
}

async function testCommandHandling() {
    log('Commands', 'Command Handling Test', 'RUNNING');
    
    const commands = [
        { cmd: 'ping', expect: 'PONG' },
        { cmd: 'time', expect: 'Current time' },
        { cmd: 'status', expect: 'Server Status' },
        { cmd: 'echo Test123', expect: 'Test123' },
        { cmd: 'chinese', expect: '你好' }
    ];
    
    return new Promise((resolve) => {
        const client = createClient();
        let received = '';
        let index = 0;
        
        client.connect(PORT, HOST, () => {
            sleep(300).then(() => {
                client.write(commands[0].cmd + '\r\n');
            });
        });
        
        client.on('data', (data) => {
            received += data.toString();
            
            if (index < commands.length - 1) {
                sleep(200).then(() => {
                    index++;
                    client.write(commands[index].cmd + '\r\n');
                });
            }
        });
        
        setTimeout(() => {
            let passed = 0;
            commands.forEach((c, i) => {
                if (received.includes(c.expect)) {
                    log('Commands', c.cmd, 'PASS');
                    passed++;
                } else {
                    log('Commands', c.cmd, 'FAIL', `Expected: ${c.expect}`);
                }
            });
            
            log('Commands', 'Overall', passed === commands.length ? 'PASS' : 'FAIL',
                `${passed}/${commands.length} commands passed`);
            client.end();
            resolve(passed === commands.length);
        }, 5000);
    });
}

async function testDisconnectReconnect() {
    log('Connection', 'Disconnect/Reconnect Test', 'RUNNING');
    
    return new Promise(async (resolve) => {
        const client1 = createClient();
        let received1 = '';
        
        client1.connect(PORT, HOST, () => {
            client1.write('quit\r\n');
        });
        
        client1.on('data', (data) => {
            received1 += data.toString();
        });
        
        await new Promise(r => setTimeout(r, 2000));
        
        const disconnected = received1.includes('Goodbye') || client1.destroyed;
        log('Connection', 'Disconnect', disconnected ? 'PASS' : 'FAIL',
            disconnected ? 'Server closed connection' : 'Connection still active');
        
        client1.destroy();
        
        await sleep(500);
        
        const client2 = createClient();
        let received2 = '';
        
        client2.connect(PORT, HOST, () => {
            log('Connection', 'Reconnect', 'PASS', 'Connected again');
            client2.write('ping\r\n');
        });
        
        client2.on('data', (data) => {
            received2 += data.toString();
        });
        
        setTimeout(() => {
            const reconnectWorked = received2.includes('PONG');
            log('Connection', 'Reconnect Response', reconnectWorked ? 'PASS' : 'FAIL');
            log('Connection', 'Overall', disconnected && reconnectWorked ? 'PASS' : 'FAIL');
            client2.end();
            resolve(disconnected && reconnectWorked);
        }, 2000);
    });
}

async function testMultipleClients() {
    log('Concurrency', 'Multiple Clients Test', 'RUNNING');
    
    const results = [];
    const clients = [];
    
    for (let i = 0; i < 5; i++) {
        const client = createClient();
        let received = '';
        const clientId = i + 1;
        
        await new Promise((resolve) => {
            client.connect(PORT, HOST, () => {
                client.write(`echo client${clientId}\r\n`);
            });
            
            client.on('data', (data) => {
                received += data.toString();
            });
            
            setTimeout(() => {
                const passed = received.includes(`client${clientId}`);
                log('Concurrency', `Client ${clientId}`, passed ? 'PASS' : 'FAIL');
                results.push(passed);
                clients.push(client);
                resolve();
            }, 2000);
        });
        
        await sleep(200);
    }
    
    const allPassed = results.every(r => r);
    log('Concurrency', 'Overall', allPassed ? 'PASS' : 'FAIL',
        `${results.filter(r => r).length}/5 clients succeeded`);
    
    clients.forEach(c => c.destroy());
    
    return allPassed;
}

async function testEncodingSupport() {
    log('Encoding', 'Encoding Test', 'RUNNING');
    
    return new Promise((resolve) => {
        const client = createClient();
        let received = '';
        
        client.connect(PORT, HOST, () => {
            sleep(500).then(() => {
                client.write('chinese\r\n');
            });
        });
        
        client.on('data', (data) => {
            received += data.toString();
        });
        
        setTimeout(() => {
            const hasChinese = received.includes('你好') || received.includes('中文');
            log('Encoding', 'Chinese Characters', hasChinese ? 'PASS' : 'FAIL',
                hasChinese ? 'UTF-8/GBK supported' : 'Encoding issue');
            
            log('Encoding', 'Overall', hasChinese ? 'PASS' : 'FAIL');
            client.end();
            resolve(hasChinese);
        }, 2000);
    });
}

async function testIACHandling() {
    log('Protocol', 'IAC Handling Test', 'RUNNING');
    
    return new Promise((resolve) => {
        const client = createClient();
        let received = '';
        let errorOccurred = false;
        
        client.connect(PORT, HOST, () => {
            sleep(500).then(() => {
                client.write(Buffer.from([0xFF, 0xFF]));
                client.write('\r\n');
                sleep(200).then(() => {
                    client.write('ping\r\n');
                });
            });
        });
        
        client.on('data', (data) => {
            received += data.toString();
        });
        
        client.on('error', (err) => {
            errorOccurred = true;
            log('Protocol', 'IAC Handling', 'FAIL', err.message);
        });
        
        setTimeout(() => {
            const stillWorks = received.includes('PONG') && !errorOccurred;
            log('Protocol', 'IAC Handling', stillWorks ? 'PASS' : 'FAIL',
                stillWorks ? 'Server handled IAC correctly' : 'Protocol error');
            
            log('Protocol', 'Overall', stillWorks ? 'PASS' : 'FAIL');
            client.end();
            resolve(stillWorks);
        }, 3000);
    });
}

async function generateReport() {
    const report = {
        title: 'IPOP Telnet Server Validation Report',
        timestamp: new Date().toISOString(),
        server: { host: HOST, port: PORT },
        summary: {
            total: validationResults.length,
            passed: validationResults.filter(r => r.status === 'PASS').length,
            failed: validationResults.filter(r => r.status === 'FAIL').length,
            running: validationResults.filter(r => r.status === 'RUNNING').length
        },
        results: validationResults
    };
    
    const reportPath = path.join(__dirname, 'validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n========================================');
    console.log('   Validation Report Summary');
    console.log('========================================\n');
    
    console.log(`Server: ${HOST}:${PORT}`);
    console.log(`Timestamp: ${report.timestamp}`);
    console.log(`\nResults:`);
    console.log(`  Total:   ${report.summary.total}`);
    console.log(`  Passed:  ${report.summary.passed}`);
    console.log(`  Failed:  ${report.summary.failed}`);
    console.log(`\nSuccess Rate: ${(report.summary.passed/report.summary.total*100).toFixed(1)}%`);
    
    console.log('\n----------------------------------------');
    console.log('   Category Breakdown');
    console.log('----------------------------------------\n');
    
    const categories = [...new Set(validationResults.map(r => r.category))];
    categories.forEach(cat => {
        const catResults = validationResults.filter(r => r.category === cat);
        const catPassed = catResults.filter(r => r.status === 'PASS').length;
        console.log(`${cat}: ${catPassed}/${catResults.length} passed`);
    });
    
    console.log(`\nReport saved: ${reportPath}`);
    
    return report;
}

async function runValidation() {
    console.log('\n========================================');
    console.log('   IPOP Telnet Server Validation');
    console.log('========================================\n');
    
    console.log('Server: ' + HOST + ':' + PORT);
    console.log('Starting validation...\n');
    
    await testTelnetConnection();
    await sleep(1000);
    
    await testCommandHandling();
    await sleep(1000);
    
    await testDisconnectReconnect();
    await sleep(1000);
    
    await testMultipleClients();
    await sleep(1000);
    
    await testEncodingSupport();
    await sleep(1000);
    
    await testIACHandling();
    
    const report = await generateReport();
    
    return report.summary.failed === 0;
}

runValidation().then((success) => {
    console.log('\n========================================');
    console.log(success ? '   ✅ Validation Complete' : '   ❌ Validation Failed');
    console.log('========================================\n');
    
    process.exit(success ? 0 : 1);
});