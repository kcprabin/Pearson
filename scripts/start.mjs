import { spawn, execSync } from 'child_process';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const isWindows = process.platform === 'win32';

// Utility for styled console logging
const log = {
  info: (msg) => console.log(`\x1b[36m${msg}\x1b[0m`),
  success: (msg) => console.log(`\x1b[32m${msg}\x1b[0m`),
  warn: (msg) => console.log(`\x1b[33m${msg}\x1b[0m`),
  error: (msg) => console.log(`\x1b[31m${msg}\x1b[0m`),
};

// Prompt user for input via terminal
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
}

// Run synchronous shell commands cross-platform
function runCmd(cmd, options = {}) {
  try {
    return execSync(cmd, {
      stdio: 'inherit',
      cwd: options.cwd || PROJECT_ROOT,
      env: { ...process.env, ...options.env },
    });
  } catch (err) {
    if (!options.allowFail) {
      log.error(`Failed executing command: ${cmd}`);
      process.exit(1);
    }
  }
}

// Determine if sudo is needed for Docker on Linux
function getDockerCmd() {
  if (isWindows) return 'docker';
  try {
    execSync('docker info', { stdio: 'ignore' });
    return 'docker';
  } catch {
    log.warn('Docker socket permission denied. Prepending "sudo"...');
    return 'sudo docker';
  }
}

async function main() {
  console.log('=================================================================');
  log.info(" Welcome! Pearson AI System Cross-Platform Setup Script.");
  console.log('=================================================================\n');

  const dockerCmd = getDockerCmd();

  // 1. Manage FreeLLM API Container
  log.info('=== 1. Checking FreeLLM API Container ===');
  const freellmDir = path.join(PROJECT_ROOT, 'scripts', 'freellmapi');

  let isRunning = false;
  try {
    const runningContainers = execSync(`${dockerCmd} ps --format "{{.Names}}"`, { stdio: 'pipe' }).toString();
    isRunning = runningContainers.includes('freellmapi');
  } catch {}

  if (isRunning) {
    log.success('FreeLLM API container is already running.');
  } else {
    if (!fs.existsSync(freellmDir)) {
      log.warn('Cloning FreeLLM API repository...');
      fs.mkdirSync(path.join(PROJECT_ROOT, 'scripts'), { recursive: true });
      runCmd('git clone https://github.com/tashfeenahmed/freellmapi.git', { cwd: path.join(PROJECT_ROOT, 'scripts') });
    }

    const freellmEnv = path.join(freellmDir, '.env');
    if (!fs.existsSync(freellmEnv)) {
      const encryptionKey = crypto.randomBytes(32).toString('hex');
      fs.writeFileSync(freellmEnv, `ENCRYPTION_KEY=${encryptionKey}\nPORT=3001\n`);
    }

    log.info('Starting FreeLLM API Docker container...');
    runCmd(`${dockerCmd} compose up -d`, { cwd: freellmDir });
  }

  console.log('\n=================================================================');
  log.info(' FreeLLM API running at: http://localhost:3001');
  console.log(' Please open http://localhost:3001, log in, generate API key.');
  console.log('=================================================================\n');

  const userApiKey = await askQuestion('Enter your generated API Key: ');
  log.info('\n=== First-Time System Configuration ===');
  const restaurantName = await askQuestion('Enter Restaurant Name: ');
  const ownerName = await askQuestion('Enter Owner Name: ');
  const phoneNumber = await askQuestion('Enter Phone Number: ');

  // 2. Generate .env file
  log.info('\n=== 2. Writing Environment (.env) ===');
  const envContent = `PORT=3000
POSTGRES_USER=prabin
POSTGRES_PASSWORD=kcprabin
POSTGRES_DB=pearson
DATABASE_URL=postgresql://prabin:kcprabin@localhost:5432/pearson
MONGO_INITDB_ROOT_USERNAME=prabin
MONGO_INITDB_ROOT_PASSWORD=kcprabin
REDIS_URL=redis://localhost:6379
KAFKA_BROKERS=localhost:9092

GOOGLE_API_KEY=${userApiKey}
AGENT_URL=http://localhost:8000

RESTAURANT_NAME="${restaurantName}"
OWNER_NAME="${ownerName}"
PHONE_NUMBER="${phoneNumber}"
`;

  fs.writeFileSync(path.join(PROJECT_ROOT, '.env'), envContent);
  log.success('.env file created successfully.');

  // 3. Infrastructure Containers
  log.info('\n=== 3. Starting Infrastructure Containers ===');
  runCmd(`${dockerCmd} compose up -d`, { cwd: path.join(PROJECT_ROOT, 'infra') });

  // 4. Install & Build Packages
  log.info('\n=== 4. Workspace Dependencies & Build ===');
  runCmd('pnpm install');

  log.info('Syncing Python Agent virtual environment...');
  runCmd('uv sync', { cwd: path.join(PROJECT_ROOT, 'services', 'agent') });

  log.warn('Building Database Package (@Pearson/database)...');
  runCmd('pnpm --filter @Pearson/database build');

  log.info('Building API and Web projects...');
  runCmd('pnpm install', { cwd: path.join(PROJECT_ROOT, 'apps', 'api') });
  runCmd('pnpm run build', { cwd: path.join(PROJECT_ROOT, 'apps', 'api') });

  runCmd('pnpm install', { cwd: path.join(PROJECT_ROOT, 'apps', 'web') });
  runCmd('pnpm run build', { cwd: path.join(PROJECT_ROOT, 'apps', 'web') });

  // 5. Spawn Background Processes
  log.info('\n=== 5. Launching Background Services ===');

  const pnpmCmd = isWindows ? 'pnpm.cmd' : 'pnpm';
  const uvCmd = isWindows ? 'uv.exe' : 'uv';

  const apiProcess = spawn(pnpmCmd, ['run', 'start:dev'], {
    cwd: path.join(PROJECT_ROOT, 'apps', 'api'),
    shell: true,
  });

  const agentProcess = spawn(uvCmd, ['run', 'fastapi', 'dev', 'src/main.py'], {
    cwd: path.join(PROJECT_ROOT, 'services', 'agent'),
    shell: true,
  });

  // Log Parser & QR Code Detection
  apiProcess.stdout.on('data', (data) => {
    const line = data.toString();
    process.stdout.write(`[API LOG] ${line}`);
    if (line.includes('QR ready') || line.includes('QR code')) {
      console.log('\n=================================================================');
      log.success(' [ALERT] QR Code detected in API output! Please scan above.');
      console.log('=================================================================\n');
    }
  });

  apiProcess.stderr.on('data', (data) => {
    process.stderr.write(`[API ERROR] ${data.toString()}`);
  });

  console.log('\n=================================================================');
  log.success(` Services running (API PID: ${apiProcess.pid} | Agent PID: ${agentProcess.pid})`);
  log.warn(" Type 'endme' to terminate background tasks.");
  console.log('=================================================================\n');

  // Input listener loop for 'endme'
  while (true) {
    const command = await askQuestion('Command: ');
    if (command === 'endme') {
      log.warn('\nStopping API and Agent background processes...');
      apiProcess.kill();
      agentProcess.kill();
      log.success('Processes terminated cleanly.');
      process.exit(0);
    }
  }
}

main();