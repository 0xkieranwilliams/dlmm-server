const { Connection, PublicKey } = require('@solana/web3.js');

async function checkBalance() {
  try {
    const pubkey = new PublicKey('ALJhvbwvQGPCcBocDPV2dk7wBeRfLyx4YLxxC9ntwKTb');
    
    // Use mainnet
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    
    console.log('Checking balance on Mainnet...');
    const balance = await connection.getBalance(pubkey);
    console.log(`Mainnet Balance: ${balance / 1e9} SOL`);
  } catch (error) {
    console.error('Error checking balance:', error);
  }
}

checkBalance();