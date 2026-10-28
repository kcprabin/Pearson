#!/usr/bin/env node

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

// Styled console logging
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

// Utility to test if a CLI tool exists
function commandExists(cmd) {
  try {
    const checkCmd = isWindows ? `where ${cmd}` : `command -v ${cmd}`;
    execSync(checkCmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
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

// Auto-installation handlers
// Auto-installation handlers
function installOpenSSL() {
  log.warn('OpenSSL not found. Attempting optional installation...');
  try {
    if (isWindows) {
      if (commandExists('winget')) {
        runCmd('winget install -e --id ShiningLight.OpenSSL', { allowFail: true });
      } else if (commandExists('choco')) {
        runCmd('choco install openssl', { allowFail: true });
      } else {
        log.warn('Warning: Unable to auto-install OpenSSL on Windows. Skipping...');
      }
    } else if (commandExists('apt-get')) {
      runCmd('sudo apt-get update && sudo apt-get install -y openssl', { allowFail: true });
    } else if (commandExists('pacman')) {
      runCmd('sudo pacman -Sy --noconfirm openssl', { allowFail: true });
    } else if (commandExists('dnf')) {
      runCmd('sudo dnf install -y openssl', { allowFail: true });
    } else if (commandExists('brew')) {
      runCmd('brew install openssl', { allowFail: true });
    } else {
      log.warn('Warning: Unable to auto-install OpenSSL. Skipping...');
    }
  } catch (err) {
    log.warn('Warning: OpenSSL installation failed, but continuing setup...');
  }
}

function installNode() {
  log.warn('Node.js not found or outdated (< v24). Installing Node 24 automatically...');
  if (isWindows) {
    if (commandExists('winget')) {
      runCmd('winget install -e --id OpenJS.NodeJS.LTS');
    } else if (commandExists('choco')) {
      runCmd('choco install nodejs');
    } else {
      log.error('Error: Unable to auto-install Node.js on Windows. Please upgrade Node.js manually.');
      process.exit(1);
    }
  } else if (commandExists('curl')) {
    runCmd('curl -fsSL https://fnm.vercel.app/install | bash');
    process.env.PATH = `${process.env.HOME}/.local/share/fnm:${process.env.PATH}`;
    runCmd('fnm install 24 && fnm default 24');
  } else if (commandExists('brew')) {
    runCmd('brew install fnm && fnm install 24 && fnm default 24');
  } else {
    log.error('Error: Unable to install Node.js automatically. Please install Node.js >= 24 manually.');
    process.exit(1);
  }
}

function installPnpm() {
  log.warn('pnpm not found. Installing automatically...');
  if (commandExists('npm')) {
    runCmd('npm install -g pnpm@11');
  } else if (commandExists('brew')) {
    runCmd('brew install pnpm');
  } else if (isWindows) {
    runCmd('iwr https://get.pnpm.io/install.ps1 -useb | iex', { allowFail: true });
  } else {
    runCmd('curl -fsSL https://get.pnpm.io/install.sh | sh -');
    process.env.PATH = `${process.env.HOME}/.local/share/pnpm:${process.env.PATH}`;
  }
}

function installUv() {
  log.warn('uv package manager not found. Installing automatically...');
  if (commandExists('curl')) {
    runCmd('curl -LsSf https://astral.sh/uv/install.sh | sh');
    process.env.PATH = `${process.env.HOME}/.local/bin:${process.env.PATH}`;
  } else if (commandExists('brew')) {
    runCmd('brew install uv');
  } else if (isWindows) {
    runCmd('powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"');
  } else {
    log.error('Error: Unable to install uv automatically. Please install uv manually.');
    process.exit(1);
  }
}

function installDocker() {
  log.warn('Docker / Docker Compose not found. Attempting automatic installation...');
  if (isWindows) {
    if (commandExists('winget')) {
      runCmd('winget install -e --id Docker.DockerDesktop');
    } else {
      log.error('Error: Please install Docker Desktop manually on Windows.');
      process.exit(1);
    }
  } else if (commandExists('apt-get')) {
    runCmd('sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin');
  } else if (commandExists('pacman')) {
    runCmd('sudo pacman -Sy --noconfirm docker docker-compose');
  } else if (commandExists('dnf')) {
    runCmd('sudo dnf install -y docker docker-compose-plugin');
  } else if (commandExists('brew')) {
    runCmd('brew install --cask docker');
  } else {
    log.error('Error: Unable to auto-install Docker. Please install Docker manually and rerun script.');
    process.exit(1);
  }

  if (!isWindows && commandExists('systemctl')) {
    runCmd('sudo systemctl start docker && sudo systemctl enable docker', { allowFail: true });
  }
}

// Determine docker command or sudo fallback
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
  log.info(" Welcome! I'm your Pearson AI System Setup & Execution Script.");
  log.info(' Initializing complete setup, infrastructure, and background jobs!');
  console.log('=================================================================\n');

  // === 1. System Prerequisites Check & Auto-Install ===
  log.info('=== 1. Checking System Prerequisites ===');

  if (!commandExists('openssl')) {
    installOpenSSL();
  }

  if (!commandExists('docker')) {
    installDocker();
  }

  try {
    execSync('docker compose version', { stdio: 'ignore' });
  } catch {
    if (!commandExists('docker-compose')) {
      installDocker();
    }
  }

  const nodeVersionMajor = parseInt(process.versions.node.split('.')[0], 10);
  if (nodeVersionMajor < 24) {
    installNode();
  }

  if (!commandExists('pnpm')) {
    installPnpm();
  }

  if (!commandExists('uv')) {
    installUv();
  }

  log.success('All system prerequisites verified!\n');

  // === 2. FreeLLM API Container ===
  log.info('=== 2. Managing FreeLLM API Container ===');
  const dockerCmd = getDockerCmd();
  const freellmDir = path.join(PROJECT_ROOT, 'scripts', 'freellmapi');

  let isRunning = false;
  try {
    const runningContainers = execSync(`${dockerCmd} ps --format "{{.Names}}"`, { stdio: 'pipe' }).toString();
    isRunning = runningContainers.includes('freellmapi');
  } catch {}

  if (isRunning) {
    log.success('FreeLLM API Docker container is already running!');
  } else {
    if (!fs.existsSync(freellmDir)) {
      log.info('Cloning FreeLLM API repository into scripts/freellmapi...');
      fs.mkdirSync(path.join(PROJECT_ROOT, 'scripts'), { recursive: true });
      runCmd('git clone https://github.com/tashfeenahmed/freellmapi.git', { cwd: path.join(PROJECT_ROOT, 'scripts') });
    } else {
      log.warn(`Directory '${freellmDir}' exists. Starting container...`);
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
  log.info(' FreeLLM API container running at: http://localhost:3001');
  console.log('=================================================================');
  console.log(' Please open http://localhost:3001 in your browser, log in,');
  console.log(' generate your API key, and paste it below.');
  console.log('=================================================================\n');

  const userApiKey = await askQuestion('Enter your generated API Key: ');

  // === 3. System Configuration ===
  log.info('\n=== 3. First-Time System Boot Configuration ===');
  log.warn('Please enter your restaurant details to complete the setup:');

  const restaurantName = await askQuestion('Enter Restaurant Name: ');
  const ownerName = await askQuestion('Enter Owner Name: ');
  const phoneNumber = await askQuestion('Enter Phone Number: ');

  // === 4. Environment File ===
  log.info('\n=== 4. Writing Target Environment (.env) ===');
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

  const envPath = path.join(PROJECT_ROOT, '.env');
  fs.writeFileSync(envPath, envContent);
  log.success(`.env file successfully configured at ${envPath}!\n`);

  // === 5. Infrastructure Containers ===
  log.info('=== 5. Starting Infrastructure Containers ===');
  runCmd(`${dockerCmd} compose up -d`, { cwd: path.join(PROJECT_ROOT, 'infra') });
  log.success('Infrastructure stack initialized (PostgreSQL, MongoDB, Redis, Kafka)!\n');

  // === 6. Workspace Dependencies & Build ===
  log.info('=== 6. Installing Workspace Dependencies & Building Database Package ===');

  log.info('Installing workspace dependencies...');
  runCmd('pnpm install');

  log.info('Installing Agent virtual environment...');
  runCmd('uv sync', { cwd: path.join(PROJECT_ROOT, 'services', 'agent') });

  log.warn('Building Database package (@Pearson/database)...');
  runCmd('pnpm --filter @Pearson/database build');

  log.info('Installing API packages...');
  runCmd('pnpm install', { cwd: path.join(PROJECT_ROOT, 'apps', 'api') });

  log.info('Installing Web packages...');
  runCmd('pnpm install', { cwd: path.join(PROJECT_ROOT, 'apps', 'web') });

  log.info('Building API project...');
  runCmd('pnpm run build', { cwd: path.join(PROJECT_ROOT, 'apps', 'api') });

  log.info('Building Web project...');
  runCmd('pnpm run build', { cwd: path.join(PROJECT_ROOT, 'apps', 'web') });

  log.success('All workspace projects built successfully!\n');

  // === 7. Launch Background Services ===
  log.info('=== 7. Background Service Launch & Log Streaming ===');

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

  // Attach log streaming and QR detection
  apiProcess.stdout.on('data', (data) => {
    const line = data.toString();
    process.stdout.write(`[API LOG] ${line}`);
    if (line.includes('QR ready') || line.includes('QR code')) {
      console.log('\n=================================================================');
      log.success(' [ALERT] QR Code detected in API output! Please check/scan above');
      console.log('=================================================================\n');
    }
  });

  apiProcess.stderr.on('data', (data) => {
    process.stderr.write(`[API ERROR] ${data.toString()}`);
  });

  agentProcess.stdout.on('data', (data) => {
    process.stdout.write(`[AGENT LOG] ${data.toString()}`);
  });

  agentProcess.stderr.on('data', (data) => {
    process.stderr.write(`[AGENT ERROR] ${data.toString()}`);
  });

  console.log('\n=================================================================');
  log.success(' Background Services Running');
  console.log(`   - API PID:   ${apiProcess.pid}`);
  console.log(`   - Agent PID: ${agentProcess.pid}`);
  console.log('=================================================================');
  log.warn(" The system will remain active until you type 'endme'.");
  console.log('=================================================================\n');

  // Cleanup handler
  const cleanup = () => {
    log.warn('\nShutting down background services...');
    try {
      apiProcess.kill();
      agentProcess.kill();
    } catch {}
    log.success('API and Agent background services stopped cleanly.');
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // Terminal input loop listening for 'endme'
  while (true) {
    const inputCmd = await askQuestion("Type 'endme' to terminate background services: ");
    if (inputCmd === 'endme') {
      log.warn('Termination command received.');
      cleanup();
    }
  }
}

main();