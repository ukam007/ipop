const net = require('net');
const fs = require('fs');
const path = require('path');

const PORT = 2323;
const HOST = '127.0.0.1';

let testResults = [];
let connectionCount = 0;

function logTest(name, passed, details = '') {
    testResults.push({ name, passed, details });
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${name}${details ? ` - ${details}` : ''}`);
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function connectAndTest(testName, commands, expectedResponses) {
    return new Promise((resolve) => {
        const client = new net.Socket();
        let received = '';
        let cmdIndex = 0;
        let passed = true;
        
        client.connect(PORT, HOST, () => {
            connectionCount++;
            logTest(`${testName} - Connection`, true);
            
            sleep(500).then(() => {
                if (commands.length > 0) {
                    client.write(commands[0] + '\r\n');
                }
            });
        });
        
        client.on('data', (data) => {
            received += data.toString();
            
            if (cmdIndex < commands.length - 1) {
                sleep(200).then(() => {
                    cmdIndex++;
                    client.write(commands[cmdIndex] + '\r\n');
                });
            } else if (cmdIndex === commands.length - 1) {
                sleep(500).then(() => {
                    for (let i = 0; i < expectedResponses.length; i++) {
                        if (!received.includes(expectedResponses[i])) {
                            passed = false;
                            logTest(`${testName} - Response ${i+1}`, false, 
                                `Expected: "${expectedResponses[i]}"`);
                        } else {
                            logTest(`${testName} - Response ${i+1}`, true);
                        }
                    }
                    
                    logTest(`${testName} - Overall`, passed);
                    client.end();
                    resolve(passed);
                });
            }
        });
        
        client.on('error', (err) => {
            logTest(`${testName} - Connection`, false, err.message);
            resolve(false);
        });
        
        client.on('close', () => {
            if (received.length > 0) {
                logTest(`${testName} - Disconnect`, true);
            }
            resolve(passed);
        });
        
        setTimeout(() => {
            if (!client.destroyed) {
                client.end();
            }
            resolve(passed);
        }, 10000);
    });
}

async function testMultipleConnections() {
    const clients = [];
    const results = [];
    
    for (let i = 0; i < 3; i++) {
        const client = new net.Socket();
        let received = '';
        
        await new Promise((resolve) => {
            client.connect(PORT, HOST, () => {
                client.write(`echo client${i}\r\n`);
            });
            
            client.on('data', (data) => {
                received += data.toString();
            });
            
            setTimeout(() => {
                const passed = received.includes(`client${i}`);
                results.push(passed);
                client.end();
                resolve();
            }, 2000);
        });
        
        await sleep(500);
    }
    
    logTest('Multiple Connections', results.every(r => r), 
        `${results.filter(r => r).length}/3 succeeded`);
}

async function testEncoding() {
    return new Promise((resolve) => {
        const client = new net.Socket();
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
            logTest('Chinese Encoding', hasChinese, 
                hasChinese ? 'Chinese chars received' : 'No Chinese chars');
            client.end();
            resolve(hasChinese);
        }, 3000);
    });
}

async function testLongCommand() {
    return new Promise((resolve) => {
        const client = new net.Socket();
        let received = '';
        const longText = 'This is a very long command text for testing buffer handling';
        
        client.connect(PORT, HOST, () => {
            sleep(500).then(() => {
                client.write(`echo ${longText}\r\n`);
            });
        });
        
        client.on('data', (data) => {
            received += data.toString();
        });
        
        setTimeout(() => {
            const passed = received.includes(longText);
            logTest('Long Command', passed);
            client.end();
            resolve(passed);
        }, 3000);
    });
}

async function testQuitCommand() {
    return new Promise((resolve) => {
        const client = new net.Socket();
        let received = '';
        let disconnected = false;
        
        client.connect(PORT, HOST, () => {
            sleep(500).then(() => {
                client.write('quit\r\n');
            });
        });
        
        client.on('data', (data) => {
            received += data.toString();
        });
        
        client.on('close', () => {
            disconnected = true;
        });
        
        setTimeout(() => {
            const passed = disconnected && received.includes('Goodbye');
            logTest('Quit Command', passed, passed ? 'Server closed connection' : 'Connection still open');
            resolve(passed);
        }, 3000);
    });
}

async function runAllTests() {
    console.log('\n========================================');
    console.log('   IPOP Telnet Server Test Suite');
    console.log('========================================\n');
    
    console.log('Starting tests...\n');
    
    await connectAndTest('Basic Commands', 
        ['help', 'ping', 'time', 'status'],
        ['Available commands', 'PONG', 'Current time', 'Server Status']
    );
    
    await sleep(1000);
    
    await connectAndTest('Echo Command',
        ['echo Hello World', 'echo IPOP Test'],
        ['Hello World', 'IPOP Test']
    );
    
    await sleep(1000);
    
    await connectAndTest('Login Simulation',
        ['login admin admin'],
        ['Login successful']
    );
    
    await sleep(1000);
    
    await connectAndTest('Repeat Command',
        ['repeat 3 Testing'],
        ['1: Testing', '2: Testing', '3: Testing']
    );
    
    await sleep(1000);
    
    await testMultipleConnections();
    
    await sleep(1000);
    
    await testEncoding();
    
    await sleep(1000);
    
    await testLongCommand();
    
    await sleep(1000);
    
    await testQuitCommand();
    
    console.log('\n========================================');
    console.log('   Test Results Summary');
    console.log('========================================\n');
    
    const passed = testResults.filter(r => r.passed).length;
    const failed = testResults.filter(r => !r.passed).length;
    const total = testResults.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${(passed/total*100).toFixed(1)}%`);
    
    if (failed > 0) {
        console.log('\nFailed Tests:');
        testResults.filter(r => !r.passed).forEach(r => {
            console.log(`  - ${r.name}: ${r.details}`);
        });
    }
    
    console.log('\n');
    
    const reportPath = path.join(__dirname, 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        total,
        passed,
        failed,
        results: testResults
    }, null, 2));
    
    console.log(`Report saved to: ${reportPath}`);
    
    return { total, passed, failed };
}

runAllTests().then(({ passed, total }) => {
    process.exit(passed === total ? 0 : 1);
});