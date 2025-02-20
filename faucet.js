import { readFileSync, appendFileSync } from 'fs';
import { Wallet } from 'ethers';

const filePath = './privateKeys.json';
const logFile = './log.txt';

const privateKeys = JSON.parse(readFileSync(filePath, 'utf-8'));

if (privateKeys.length === 0) {
  console.error('❌ Error: Private key not found.');
  appendFileSync(logFile, `[${new Date().toISOString()}] ❌ Error: Private key not found.\n`);
  process.exit(1);
}

const url = 'https://faucet.testnet.humanity.org/api/claim';
const headers = {
  'Accept': '*/*',
  'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
  'Content-Type': 'application/json',
  'Origin': 'https://faucet.testnet.humanity.org',
  'Referer': 'https://faucet.testnet.humanity.org/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
};

const writeLog = (message) => {
  const logMessage = `[${new Date().toISOString()}] ${message}\n`;
  appendFileSync(logFile, logMessage);
};

// Fungsi untuk menampilkan sebagian address
const maskAddress = (address) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const requestFaucet = async () => {
  for (const [index, privateKey] of privateKeys.entries()) {
    try {
      const wallet = new Wallet(privateKey);
      const walletAddress = wallet.address;
      const maskedAddress = maskAddress(walletAddress);

      console.log(`🚀 Requesting faucet for address: ${maskedAddress}`);
      writeLog(`🚀 Requesting faucet for address: ${maskedAddress}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ address: walletAddress })
      });

      const data = await response.json();
      if (data.msg && data.msg.startsWith('Txhash:')) {
        const txHash = data.msg.split('Txhash: ')[1];
        console.log(`✅ Success! Address: ${maskedAddress}`);
        console.log(`🔗 Transaction Hash: https://explorer.testnet.humanity.org/tx/${txHash}`);

        writeLog(`✅ Success! Address: ${maskedAddress}`);
        writeLog(`🔗 Transaction Hash: https://explorer.testnet.humanity.org/tx/${txHash}`);
      } else {
        console.log(`⚠️ Unexpected Response for ${maskedAddress}:`, data);
        writeLog(`⚠️ Unexpected Response for ${maskedAddress}: ${JSON.stringify(data)}`);
      }

    } catch (error) {
      console.error(`❌ Error processing ${maskAddress(walletAddress)}:`, error);
      writeLog(`❌ Error processing ${maskAddress(walletAddress)}: ${error.message}`);
    }
    if (index < privateKeys.length - 1) {
      console.log(`⏳ Waiting 1 minute before the next request...`);
      writeLog(`⏳ Waiting 1 minute before the next request...`);
      await delay(60000);
    }
  }
};

requestFaucet();
