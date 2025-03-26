/**
 * Utility functions for Solana interactions
 */
const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const fs = require('fs');

/**
 * Load a keypair from a JSON file
 * @param {string} path - Path to the keypair JSON file
 * @returns {Keypair} Solana keypair
 */
function loadKeypairFromFile(path) {
  try {
    const keypairData = JSON.parse(fs.readFileSync(path, 'utf8'));
    return Keypair.fromSecretKey(Uint8Array.from(keypairData));
  } catch (error) {
    throw new Error(`Failed to load keypair from ${path}: ${error.message}`);
  }
}

/**
 * Get token balance for a specific token account
 * @param {Connection} connection - Solana connection
 * @param {string} tokenAccountAddress - Token account address
 * @returns {Promise<number>} Token balance
 */
async function getTokenBalance(connection, tokenAccountAddress) {
  try {
    const accountInfo = await connection.getTokenAccountBalance(
      new PublicKey(tokenAccountAddress)
    );
    return parseFloat(accountInfo.value.uiAmount);
  } catch (error) {
    throw new Error(`Failed to get token balance: ${error.message}`);
  }
}

/**
 * Airdrop SOL to a wallet for testing
 * @param {Connection} connection - Solana connection
 * @param {PublicKey} publicKey - Wallet public key
 * @param {number} amount - Amount in LAMPORTS_PER_SOL
 * @returns {Promise<string>} Transaction signature
 */
async function requestAirdrop(connection, publicKey, amount) {
  try {
    const signature = await connection.requestAirdrop(publicKey, amount);
    await connection.confirmTransaction(signature);
    return signature;
  } catch (error) {
    throw new Error(`Failed to request airdrop: ${error.message}`);
  }
}

module.exports = {
  loadKeypairFromFile,
  getTokenBalance,
  requestAirdrop
};