const axios = require('axios');
const qs = require('qs');
const fs = require('fs');
const cfonts = require('cfonts');
const chalk = require('chalk');
const readline = require('readline');

const LOOP_INTERVAL = 24 * 60 * 60 * 1000;
const SETTINGS_FILE = 'settings.json';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Utility functions
function logMessage(currentNum, total, message, level = 'info') {
  const levels = { info: '[INFO]', warn: '[WARN]', error: '[ERROR]' };
  const formattedMessage = `${levels[level]} [${currentNum}/${total}] ${message}`;
  console.log(formattedMessage);
}

function prompt(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

function loadSettings() {
  if (fs.existsSync(SETTINGS_FILE)) {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
  }
  return { mode: null, manualAnswerIdx: null };
}

function saveSettings(mode, manualAnswerIdx) {
  fs.writeFileSync(
    SETTINGS_FILE,
    JSON.stringify({ mode, manualAnswerIdx }, null, 2)
  );
}

// Main class for API interaction
class AriChain {
  constructor(total) {
    this.total = total;
    this.currentNum = 0;
  }

  async makeRequest(method, url, options) {
    try {
      const response = await axios({ method, url, ...options });
      return response;
    } catch (error) {
      console.error(`Request failed: ${error.message}`);
      return null;
    }
  }

  async checkinDaily(address) {
    const headers = {
      accept: '*/*',
      'content-type': 'application/x-www-form-urlencoded',
    };
    const data = qs.stringify({ address });
    const response = await this.makeRequest(
      'POST',
      'https://arichain.io/api/event/checkin',
      { headers, data }
    );
    if (!response) {
      logMessage(this.currentNum, this.total, 'Failed check-in', 'error');
      return null;
    }
    logMessage(this.currentNum, this.total, 'Check-in successful', 'info');
    return response.data;
  }

  async transferToken(email, toAddress, password, amount = 60) {
    const headers = {
      accept: '*/*',
      'content-type': 'application/x-www-form-urlencoded',
    };
    const data = qs.stringify({
      email,
      to_address: toAddress,
      pw: password,
      amount,
    });
    const response = await this.makeRequest(
      'POST',
      'https://arichain.io/api/wallet/transfer_mobile',
      { headers, data }
    );
    if (!response) {
      logMessage(this.currentNum, this.total, 'Failed to send token', 'error');
      return null;
    }
    logMessage(this.currentNum, this.total, 'Token transfer successful', 'info');
    return response.data;
  }

  async dailyAnswer(email, address, isManualMode, manualAnswerIdx) {
    const headers = {
      accept: '*/*',
      'content-type': 'application/x-www-form-urlencoded',
    };
    const answer = isManualMode ? manualAnswerIdx : getRandomInt(1, 5);
    const data = qs.stringify({ email, address, answer });
    const response = await this.makeRequest(
      'POST',
      'https://arichain.io/api/daily/answer',
      { headers, data }
    );
    if (!response) {
      logMessage(this.currentNum, this.total, 'Failed daily answer', 'error');
      return null;
    }
    logMessage(this.currentNum, this.total, 'Daily answer successful', 'info');
    return response.data;
  }
}

// Main functions
async function processAccounts(option) {
  const file = fs.readFileSync('./data.txt', 'utf-8');
  const splitFile = file.replace(/\r\n/g, '\n').split('\n');
  const total = splitFile.length;
  console.log(`[ Total ${total} Stores ]\n`);

  let settings = loadSettings();
  let isManualMode, manualAnswerIdx;

  if (option === '1') {
    if (!settings.mode) {
      const answerMode = await prompt(
        chalk.yellow('Choose answer mode: (1) Manual, (2) Auto [1/2]: ')
      );
      isManualMode = answerMode === '1';
      if (isManualMode) {
        manualAnswerIdx = await prompt(chalk.yellow('Choose answer (1-4): '));
      }
      saveSettings(isManualMode ? 'manual' : 'auto', manualAnswerIdx);
    } else {
      isManualMode = settings.mode === 'manual';
      manualAnswerIdx = isManualMode ? settings.manualAnswerIdx : null;
    }
  }

  for (let i = 0; i < total; i++) {
    const arichain = new AriChain(total);
    const line = splitFile[i].split(':');
    const [email, password, address, recipientAddress] = line;

    console.log(chalk.green(`\nProcessing User ${i + 1} of ${total}`));
    console.log(chalk.yellow(`- Email: ${email}`));
    console.log(chalk.yellow(`- Address: ${address}`));
    if (recipientAddress) console.log(chalk.yellow(`- Recipient: ${recipientAddress}\n`));

    try {
      let result;
      switch (option) {
        case '1': // Daily Answer
          console.log(chalk.green('Performing daily answer...'));
          result = await arichain.dailyAnswer(email, address, isManualMode, manualAnswerIdx);
          break;
        case '2': // Daily Check In
          console.log(chalk.green('Performing daily check-in...'));
          result = await arichain.checkinDaily(address);
          break;
        case '3': // Token Transfer
          console.log(chalk.green('Transferring tokens...'));
          result = await arichain.transferToken(email, recipientAddress, password, getRandomInt(1, 7));
          break;
      }

      if (result) {
        console.log(chalk.green(`Result: ${JSON.stringify(result)}`));
      }
    } catch (error) {
      console.error(chalk.red(`Operation failed: ${error.message}`));
    }
  }
}

async function main() {
  console.log(chalk.cyan(`
       █████╗ ██████╗ ██████╗     ███╗   ██╗ ██████╗ ██████╗ ███████╗
      ██╔══██╗██╔══██╗██╔══██╗    ████╗  ██║██╔═══██╗██╔══██╗██╔════╝
      ███████║██║  ██║██████╔╝    ██╔██╗ ██║██║   ██║██║  ██║█████╗  
      ██╔══██║██║  ██║██╔══██╗    ██║╚██╗██║██║   ██║██║  ██║██╔══╝  
      ██║  ██║██████╔╝██████╔╝    ██║ ╚████║╚██████╔╝██████╔╝███████╗
      ╚═╝  ╚═╝╚═════╝ ╚═════╝     ╚═╝  ╚═══╝ ╚═════╝ ╚═════╝ ╚══════╝
  `));
  
  cfonts.say('NT Exhaust', {
    font: 'block',
    align: 'center',
    colors: ['cyan', 'magenta'],
    background: 'black',
  });
  console.log(chalk.green('=== Telegram Channel : NT Exhaust ( @NTExhaust ) ==='));

  while (true) {
    console.log(chalk.cyan('\nSelect an option:'));
    console.log('1. Daily Answer');
    console.log('2. Daily Check In');
    console.log('3. Token Transfer');
    console.log('4. Exit');

    const choice = await prompt(chalk.yellow('Enter your choice (1-4): '));

    if (choice === '4') {
      console.log(chalk.green('Exiting...'));
      rl.close();
      break;
    }

    if (['1', '2', '3'].includes(choice)) {
      await processAccounts(choice);
      console.log(chalk.yellow('\nWaiting for 24 hours before next run...'));
      await new Promise(resolve => setTimeout(resolve, LOOP_INTERVAL));
    } else {
      console.log(chalk.red('Invalid option. Please choose 1-4.'));
    }
  }
}

main();
