const { ethers } = require('ethers');
const kleur = require("kleur");
const axios = require("axios");
const path = require("path");
const fs = require('fs');
const PRIVATE_KEYS = JSON.parse(fs.readFileSync('privateKeys.json', 'utf-8'));
const moment = require('moment-timezone');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


function timelog() {
  return moment().tz('Asia/Jakarta').format('HH:mm:ss | DD-MM-YYYY');
}

function appendLog(message) {
  fs.appendFileSync('log.txt', message + '\n');
}
const loading = (message, duration) => {
  return new Promise((resolve) => {
    const symbols = ['|', '/', '-', '\\'];
    let currentIndex = 0;

    const intervalTime = 200;
    let totalIterations = duration / intervalTime;

    const interval = setInterval(() => {
      process.stdout.write(`\r${message} [${symbols[currentIndex]}]`);
      currentIndex = (currentIndex + 1) % symbols.length;

      if (totalIterations-- <= 0) {
        clearInterval(interval);
        process.stdout.write('\n');
        resolve();
      }
    }, intervalTime);
  });
};
async function performFaucet(privateKey) {
  let address;
  try {
    const wallet = new ethers.Wallet(privateKey);
    walletAddress = await wallet.getAddress();
	await loading(`Start get faucet ${wallet.address}...`, 2000);  
    const humanityFaucet = await axios.post(
	"https://points-mainnet.reddio.com/v1/points/verify",
	{
		address: walletAddress,
	},
	{
		headers: {
		"Content-Type": "application/json",
		"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
		},
	 }
	);

    console.log(kleur.green(`[${timelog()}] Get faucet successful for ${walletAddress}`));
    appendLog(`[${timelog()}] Get faucet successful for ${walletAddress}`);
    return {
      humanityFaucet: humanityFaucet.data,
    };
  } catch (error) {
    console.error(kleur.yellow(`[${timelog()}] Get faucet failed for ${address || 'unknown address'}: `), error.message);
    appendLog(`[${timelog()}] Get faucet failed for ${address || 'unknown address'}`);
	return;
    throw error;
  }
}
async function runFaucet() {
    header();
    for (const [index, privateKey] of PRIVATE_KEYS.entries()) {
        try {
          await performFaucet(privateKey);
	  await loading(`Delay 1 minute before next account`, 60000); 
          console.log('');
        } catch (error) {
            console.error(kleur.red(`[${timelog()}] Error processing wallet ${index + 1}: ${error.message}`));
	    appendLog(`[${timelog()}] Error processing wallet ${index + 1}: ${error.message}`);
        }
    }
}
