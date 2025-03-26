/**
 * Meteora DLMM Manager Server
 * 
 * This server provides API endpoints for interacting with Meteora DLMM pools
 * on the Solana blockchain.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Connection, PublicKey, Keypair } = require('@solana/web3.js');

// Import services
const MeteoraDLMMKeeperService = require('./services/MeteoraDLMMKeeperService');
const MeteoraDLMMInteractionsService = require('./services/MeteoraDLMMInteractionsService');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const interactionsService = new MeteoraDLMMInteractionsService(RPC_URL);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Protocol metrics endpoint
app.get('/api/metrics', async (req, res) => {
  try {
    const metrics = await MeteoraDLMMKeeperService.getProtocolMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching protocol metrics:', error);
    res.status(500).json({ error: 'Failed to fetch protocol metrics' });
  }
});

// Get all pairs endpoint
app.get('/api/pairs', async (req, res) => {
  try {
    const includeUnknown = req.query.include_unknown !== 'false'; // Default to true
    const pairs = await MeteoraDLMMKeeperService.getAllPairs(includeUnknown);
    res.json(pairs);
  } catch (error) {
    console.error('Error fetching pairs:', error);
    res.status(500).json({ error: 'Failed to fetch pairs' });
  }
});

// Get specific pair endpoint
app.get('/api/pairs/:pairAddress', async (req, res) => {
  try {
    const { pairAddress } = req.params;
    const pair = await MeteoraDLMMKeeperService.getPair(pairAddress);
    res.json(pair);
  } catch (error) {
    console.error(`Error fetching pair ${req.params.pairAddress}:`, error);
    res.status(500).json({ error: 'Failed to fetch pair data' });
  }
});

// Get pool active bin endpoint
app.get('/api/pools/:poolAddress/active-bin', async (req, res) => {
  try {
    const { poolAddress } = req.params;
    
    // Initialize the pool if it's not already initialized
    if (!interactionsService.dlmmPools.has(poolAddress)) {
      await interactionsService.initializePool(poolAddress);
    }
    
    const activeBin = await interactionsService.getActiveBin(poolAddress);
    res.json({ poolAddress, activeBin });
  } catch (error) {
    console.error(`Error fetching active bin for pool ${req.params.poolAddress}:`, error);
    res.status(500).json({ error: 'Failed to fetch active bin' });
  }
});

// Get user positions endpoint
app.get('/api/users/:userAddress/pools/:poolAddress/positions', async (req, res) => {
  try {
    const { userAddress, poolAddress } = req.params;
    const userPublicKey = new PublicKey(userAddress);
    
    // Initialize the pool if it's not already initialized
    if (!interactionsService.dlmmPools.has(poolAddress)) {
      await interactionsService.initializePool(poolAddress);
    }
    
    const positions = await interactionsService.getUserPositions(poolAddress, userPublicKey);
    res.json({ poolAddress, userAddress, positions });
  } catch (error) {
    console.error(`Error fetching positions for user ${req.params.userAddress} in pool ${req.params.poolAddress}:`, error);
    res.status(500).json({ error: 'Failed to fetch user positions' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Using Solana RPC URL: ${RPC_URL}`);
});