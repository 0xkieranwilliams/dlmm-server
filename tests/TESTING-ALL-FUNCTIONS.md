# Testing All DLMM Service Functions with Real Transactions

This guide explains how to test all your DLMM service functions with real blockchain interactions.

## Overview

The test suite includes real transaction tests for all the core functions:

1. **Pool Initialization** - Connect to a real DLMM pool on Solana
2. **Getting Pool Data** - Fetch active bin data and other pool information
3. **User Positions** - Retrieve your wallet positions in the pool
4. **Adding Liquidity** - Add a tiny amount of tokens to a position
5. **Removing Liquidity** - Remove tokens from a position
6. **Moving Funds** - Move liquidity between different pools

## Required Funds

For full transaction testing, your wallet needs:

1. **SOL** - At least 0.01 SOL for transaction fees
2. **Trump Tokens** - A small amount (0.001 or more) for the primary test pool
3. **USDC** - A tiny amount for the second pool in the move funds test (optional)

These amounts are very small as the tests are designed to use minimal funds.

## Running the Tests

1. **Fund your wallet** with the required tokens
   ```
   # Your wallet address:
   ALJhvbwvQGPCcBocDPV2dk7wBeRfLyx4YLxxC9ntwKTb
   ```

2. **Run the transaction test script**
   ```bash
   ./tests/run-transaction-tests.sh
   ```

3. **Confirm when prompted** to execute real transactions

## What Happens During Testing

The script will:

1. Check your wallet balance
2. Verify you have Trump token positions (or create one)
3. Add a tiny amount of liquidity to the Trump token pool
4. Remove some or all liquidity from your position
5. Attempt to move some funds to a second pool (may fail if tokens unavailable)

## Testing Each Function Individually

If you want to test functions individually:

### 1. Pool Initialization and Data Retrieval
```bash
npx jest tests/MeteoraDLMMInteractionsService.test.js -t "should initialize a real pool|should get the active bin"
```

### 2. User Position Retrieval
```bash
npx jest tests/MeteoraDLMMInteractionsService.test.js -t "should get user positions if they exist"
```

### 3. Adding Liquidity
```bash
npx jest tests/MeteoraDLMMInteractionsService.test.js -t "should add a tiny amount of liquidity"
```

### 4. Removing Liquidity
```bash
npx jest tests/MeteoraDLMMInteractionsService.test.js -t "should remove liquidity"
```

### 5. Moving Funds Between Pools
```bash
npx jest tests/MeteoraDLMMInteractionsService.test.js -t "should move funds between pools"
```

## Common Issues

1. **Insufficient SOL** - Most common reason for test failures
2. **Insufficient Trump Tokens** - Required for adding liquidity
3. **No Existing Positions** - The removal test will be skipped
4. **Transaction Timeout** - Increase timeout values if needed

## Expected Outcomes

1. **After Adding Liquidity**: You'll have a position in the Trump pool
2. **After Removing Liquidity**: Some or all of your tokens will be returned to your wallet
3. **After Moving Funds**: You'll have positions in both pools (if successful)

## Amounts & Costs

- **Adding liquidity**: 0.001 Trump tokens + 0.001 SOL
- **Transaction fees**: ~0.0001-0.001 SOL per transaction
- **Total expected cost**: ~0.005 SOL + 0.001 Trump tokens

Most funds will be recoverable by removing liquidity after testing.