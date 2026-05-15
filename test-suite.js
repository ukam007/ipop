const net = require('net');

const PORT = 2323;
const HOST = '127.0.0.1';

let testsPassed = 0;
let testsFailed = 0;
const results = [];

function logTest(name, passed, details = '') {
    const status = passed ? 'PASS' : 'FAIL';
    results.push({ name, status, details });
    console.log(`[${status}] ${name}${details ? ` - ${details}` : ''}`);
    if (passed) testsPassed++;
    else testsFailed++;
}

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function testConnection() {
    return new Promise(resolve => {
        const client = net.Socket();
        let received = '';
        let connected = false;
        
        client.setTimeout(5000);
        
        client.connect(PORT, HOST, () => {
            connected = true;
            logTest('TCP Connection', true);
        });
        
        client.on('data', data => {
            received += data.toString();
            if (received.includes('Welcome') && connected) {
                logTest('Welcome Banner', true);
                client.write('help\r');
            }
            if (received.includes('Available commands')) {
                logTest('Help Command', true);
                client.end();
                resolve(true);
            }
        });
        
        client.on('error', err => {
            logTest('TCP Connection', false, err.message);
            resolve(false);
        });
        
        client.on('timeout', () => {
            logTest('TCP Connection', false, 'Timeout');
            client.destroy();
            resolve(false);
        });
        
        setTimeout(() => {
            if (!received.includes('Welcome')) {
                logTest('Welcome Banner', false, 'No banner received');
                client.destroy();
                resolve(false);
            }
        }, 3000);
    });
}

async function testCommands() {
    return new Promise(resolve => {
        const client = net.Socket();
        let received = '';
        let testsDone = 0;
        const expectedTests = 4;
        
        client.connect(PORT, HOST, async () => {
            await sleep(500);
            client.write('ping\r');
        });
        
        client.on('data', data => {
            received += data.toString();
            
            if (received.includes('PONG!') && testsDone === 0) {
                logTest('Ping Command', true);
                testsDone++;
                client.write('time\r');
            } else if (received.includes('Current time') && testsDone === 1) {
                logTest('Time Command', true);
                testsDone++;
                client.write('chinese\r');
            } else if (received.includes('你好') && testsDone === 2) {
                logTest('Chinese Encoding', true);
                testsDone++;
                client.write('echo Test123\r');
            } else if (received.includes('Test123') && testsDone === 3) {
                logTest('Echo Command', true);
                testsDone++;
                client.end();
                resolve(true);
            }
        });
        
        client.on('error', err => {
            logTest('Commands Test', false, err.message);
            resolve(false);
        });
        
        setTimeout(() => {
            if (testsDone < expectedTests) {
                logTest('Commands Overall', false, `Only ${testsDone}/${expectedTests} passed`);
                client.destroy();
                resolve(false);
            }
        }, 5000);
    });
}

async function testQuit() {
    return new Promise(resolve => {
        const client = net.Socket();
        let received = '';
        let disconnected = false;
        
        client.connect(PORT, HOST, async () => {
            await sleep(300);
            client.write('quit\r');
        });
        
        client.on('data', data => {
            received += data.toString();
        });
        
        client.on('end', () => {
            disconnected = true;
            if (received.includes('Goodbye')) {
                logTest('Quit Command', true);
            } else {
                logTest('Quit Command', false, 'No goodbye message');
            }
            resolve(disconnected);
        });
        
        client.on('error', err => {
            logTest('Quit Command', false, err.message);
            resolve(false);
        });
        
        setTimeout(() => {
            if (!disconnected) {
                logTest('Quit Command', false, 'Did not disconnect');
                client.destroy();
                resolve(false);
            }
        }, 3000);
    });
}

async function testLogin() {
    return new Promise(resolve => {
        const client = net.Socket();
        let received = '';
        let loginTestDone = false;
        
        client.connect(PORT, HOST, async () => {
            await sleep(300);
            client.write('login admin admin\r');
        });
        
        client.on('data', data => {
            received += data.toString();
            
            if (received.includes('Login successful') && !loginTestDone) {
                logTest('Login Command', true);
                loginTestDone = true;
                client.end();
                resolve(true);
            }
        });
        
        client.on('error', err => {
            logTest('Login Command', false, err.message);
            resolve(false);
        });
        
        setTimeout(() => {
            if (!loginTestDone) {
                if (received.includes('Login failed')) {
                    logTest('Login Command', false, 'Login rejected');
                } else {
                    logTest('Login Command', false, 'No login response');
                }
                client.destroy();
                resolve(false);
            }
        }, 3000);
    });
}

async function runAllTests() {
    console.log('\n========================================');
    console.log('   IPOP Telnet Server Validation Suite');
    console.log('========================================\n');
    
    console.log('Testing connection...');
    await testConnection();
    await sleep(500);
    
    console.log('\nTesting commands...');
    await testCommands();
    await sleep(500);
    
    console.log('\nTesting disconnect...');
    await testQuit();
    await sleep(500);
    
    console.log('\nTesting login...');
    await testLogin();
    
    console.log('\n========================================');
    console.log('   Test Summary');
    console.log('========================================');
    console.log(`Total Tests: ${testsPassed + testsFailed}`);
    console.log(`Passed: ${testsPassed}`);
    console.log(`Failed: ${testsFailed}`);
    console.log(`Success Rate: ${((testsPassed/(testsPassed+testsFailed))*100).toFixed(1)}%`);
    
    if (testsFailed > 0) {
        console.log('\nFailed Tests:');
        results.filter(r => r.status === 'FAIL').forEach(r => {
            console.log(`  - ${r.name}: ${r.details}`);
        });
    }
    
    console.log('\n');
    
    const report = {
        timestamp: new Date().toISOString(),
        server: { host: HOST, port: PORT },
        summary: {
            total: testsPassed + testsFailed,
            passed: testsPassed,
            failed: testsFailed
        },
        results
    };
    
    require('fs').writeFileSync('validation-report.json', JSON.stringify(report, null, 2));
    console.log('Report saved to: validation-report.json');
    
    return testsFailed === 0;
}

runAllTests().then(success => {
    console.log(success ? '\n✅ All tests passed!' : '\n❌ Some tests failed');
    process.exit(success ? 0 : 1);
});