const axios = require('axios');
const qs = require('qs');
const fs = require("fs");
const cfonts = require("cfonts");
const chalk = require('chalk');
const LOOP_INTERVAL = 24 * 60 * 60 * 1000
// Utility function for logging
function logMessage(currentNum, total, message, level = 'info') {
  const levels = {
    info: '[INFO]',
    warn: '[WARN]',
    error: '[ERROR]',
  };
  const formattedMessage = `${levels[level]} [${currentNum}/${total}] ${message}`;
  console.log(formattedMessage);
}

// Main class for API interaction
class AriChain {
  constructor(total) {
    this.total = total;
    this.currentNum = 0;
  }

  // Generic request handler
  async makeRequest(method, url, options) {
    try {
      const response = await axios({
        method,
        url,
        ...options,
      });
      return response;
    } catch (error) {
      console.error(`Request failed: ${error.message}`);
      return null;
    }
  }

  // Daily check-in method
  async checkinDaily(address) {
    const headers = {
      accept: '*/*',
      'content-type': 'application/x-www-form-urlencoded',
    };
    const data = qs.stringify({ address });
    const response = await this.makeRequest(
      'POST',
      'https://arichain.io/api/event/checkin',
      {
        headers,
        data,
      }
    );
    if (!response) {
    //   logMessage('Failed check-in', 'error');
      return null;
    }
    // logMessage('Check-in successful', 'info');
    return response.data;
  }

  // Token transfer method
  async transferToken(email, toAddress, password, amount = 60) {
    const headers = {
      accept: '*/*',
      'content-type': 'application/x-www-form-urlencoded',
    };
    const transferData = qs.stringify({
      email,
      to_address: toAddress,
      pw: password,
      amount,
    });
    const response = await this.makeRequest(
      'POST',
      'https://arichain.io/api/wallet/transfer_mobile',
      {
        headers,
        data: transferData,
      }
    );
    if (!response) {
    //   logMessage('Failed to send token', 'error');
      return null;
    }
    // logMessage('Token transfer successful', 'info');
    return response.data;
  }
}

// Example usage
(async () => {
cfonts.say('NT Exhaust', {
        font: 'block',        // Options: 'block', 'simple', '3d', etc.
        align: 'center',
        colors: ['cyan', 'magenta'],
        background: 'black',
        letterSpacing: 1,
        lineHeight: 1,
        space: true,
        maxLength: '0',
      });
    console.log(chalk.green("=== Telegram Channel : NT Exhaust ( @NTExhaust ) ==="))

for(a = 0; a <10000;a++){    
  const file = fs.readFileSync('./data.txt', 'utf-8');
  const splitFile = file.split('\r\n');
  console.log(`[ Total ${splitFile.length} Stores ]\n`);

  for (let i = 0; i < splitFile.length; i++) {
    const arichain = new AriChain(splitFile.length);
    const line = splitFile[i].split(':');
    const email = line[0];
    const password = line[1];
    const address = line[2];
    const recipientAddress = line[3];

    console.log(chalk.green(`\nProcessing User ${i + 1} of ${splitFile.length}`));
    console.log(chalk.yellow(`- Email: ${email}`));
    console.log(chalk.yellow(`- Address: ${address}`));
    console.log(chalk.yellow(`- Recipient Address: ${recipientAddress}\n`));

    // Perform a daily check-in
    console.log(chalk.green('Performing daily check-in...'));
    const checkinResult = await arichain.checkinDaily(address);
    const msg = checkinResult.msg
    if (checkinResult.status === 'success') {
        console.log(chalk.green(`Check-in result: { "msg": "Successfully Check in" }`));
      } else {
        console.log(chalk.red(`Check-in result: { "msg": "${msg}" }`));
      }
    

    // Transfer tokens
    console.log(chalk.green('Transferring tokens...'));
    const transferResult = await arichain.transferToken(
      email,
      recipientAddress,
      password,
      1 // Amount of tokens to transfer
    );
    const msg2 = transferResult.status
    if (transferResult.status === 'success') {
        console.log(chalk.green(`Transfer result: { "msg": "${msg2}" }`));
      } else {
        console.log(chalk.red(`Transfer result: { "msg": "${msg2}" }`));
      }
  }
  console.log(`Waiting for 24 Hours before the next transaction...`, "\x1b[33m");
  await new Promise((resolve) => setTimeout(resolve, LOOP_INTERVAL));
}
})();
