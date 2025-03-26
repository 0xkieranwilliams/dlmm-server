/**
 * Cleanup script for removing all liquidity and closing all positions
 * for a user in the Meteora DLMM pools.
 * 
 * Usage: node cleanup-positions.js [poolAddress]
 */
require('dotenv').config();
const { Connection } = require('@solana/web3.js');
const { loadKeypairFromFile } = require('./utils/solana');
const MeteoraDLMMInteractionsService = require('./services/MeteoraDLMMInteractionsService');

// Set up configuration
const KEYPAIR_PATH = process.env.KEYPAIR_PATH || './id.json';
const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

// Pool address can be specified as a command-line argument, otherwise use default
const DEFAULT_POOL_ADDRESS = '71HuFmuYAFEFUna2x2R4HJjrFNQHGuagW3gUMFToL9tk'; // Trump/USDC pool
const poolAddress = process.argv[2] || DEFAULT_POOL_ADDRESS;

async function cleanupPositions() {
  try {
    console.log("=========================================");
    console.log("DLMM Position Cleanup Utility");
    console.log("=========================================");
    console.log("Starting cleanup to return all funds to wallet...");
    
    // Load keypair
    const userKeypair = loadKeypairFromFile(KEYPAIR_PATH);
    console.log(`Using keypair: ${userKeypair.publicKey.toString()}`);
    console.log(`Pool address: ${poolAddress}`);
    
    // Initialize service and connection
    const connection = new Connection(RPC_URL);
    const service = new MeteoraDLMMInteractionsService(RPC_URL);
    
    // Initialize the pool
    console.log(`Initializing pool...`);
    await service.initializePool(poolAddress);
    
    // Check for positions
    const positions = await service.getUserPositions(poolAddress, userKeypair.publicKey);
    console.log(`Found ${positions.length} positions to clean up`);
    
    if (positions.length === 0) {
      console.log("No positions to clean up");
      return;
    }
    
    // Display position details
    positions.forEach((position, index) => {
      console.log(`Position ${index + 1}: ${position.publicKey.toString()}`);
      console.log(`  Bins: ${position.positionData.positionBinData.map(bin => bin.binId).join(', ')}`);
    });
    
    // Confirm before proceeding
    console.log("\nWARNING: This will remove ALL liquidity and close ALL positions!");
    console.log("Press Ctrl+C now to abort, or wait 5 seconds to continue...");
    
    // Wait for 5 seconds to allow user to abort
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Remove ALL liquidity from ALL positions
    console.log("\nProceeding with cleanup...");
    const options = {
      bpsToRemove: 10000, // 100%
      shouldClaimAndClose: true // Close position completely
    };
    
    await service.removeLiquidity(userKeypair, poolAddress, options);
    console.log("Successfully removed all liquidity and closed positions");
    
    // Verify cleanup
    const positionsAfter = await service.getUserPositions(poolAddress, userKeypair.publicKey);
    console.log(`Positions remaining after cleanup: ${positionsAfter.length}`);
    
    console.log("=========================================");
    console.log("Cleanup complete! All funds should now be back in your wallet.");
    console.log("=========================================");
  } catch (error) {
    console.error("Error during cleanup:", error);
    process.exit(1);
  }
}

cleanupPositions();