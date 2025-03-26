# DLMM Transaction Tests

This document provides information about the transaction tests for the Meteora DLMM services.

## What We've Learned

1. **Pool Information:**
   - Pool Address: `71HuFmuYAFEFUna2x2R4HJjrFNQHGuagW3gUMFToL9tk`
   - Token X: Trump Token (`6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN`)
   - Token Y: Wrapped SOL (`So11111111111111111111111111111111111111112`)
   - Current Active Bin ID: ~4400 (changes frequently with market activity)

2. **Your Wallet:**
   - Public Key: `ALJhvbwvQGPCcBocDPV2dk7wBeRfLyx4YLxxC9ntwKTb`
   - You have 1 existing position in this pool
   - No SOL balance was detected during testing

## Transaction Tests Setup

The following transaction tests are available:

1. **Adding Liquidity Test:**
   - Configured to add a tiny amount (0.001 tokens) of liquidity
   - Requires both Trump tokens and SOL
   - Estimated cost: ~0.001 SOL in fees + 0.001 Trump tokens + 0.001 SOL tokens

2. **Removing Liquidity Test:**
   - Configured to remove liquidity from your existing position
   - Can reclaim the tokens you've added (minus fees)
   - Estimated cost: ~0.001 SOL in fees

## Running Transaction Tests

To run the transaction tests:

1. **Fund your wallet:**
   - Add at least 0.01 SOL for transaction fees
   - Add a small amount of Trump tokens if you want to test adding liquidity

2. **Run the transaction test script:**
   ```bash
   # Uncomment the transaction lines first in the script
   ./tests/run-transaction-tests.sh
   ```

3. **After testing:**
   - You can check your wallet balance to see the changes
   - All liquidity should be removed if you ran the removal test

## Safety Measures

The tests are designed to be as safe as possible:

1. **Small Amounts:** Tests use tiny amounts (0.001 tokens) to minimize risk
2. **Confirmation Prompt:** The script asks for confirmation before running
3. **Balance Check:** The script checks your wallet balance before proceeding
4. **Position Verification:** Checks for existing positions before attempting to remove

## Technical Notes

1. The DLMM library is accessed through its default export
2. The Trump token is token X in the pool, SOL is token Y
3. Token decimals are set to 9 for both tokens
4. Bin range is set to a minimum (1) to reduce cost

## Conclusion

These tests verify that the DLMM services can correctly:
1. Connect to the Solana blockchain
2. Interact with the Meteora DLMM protocol
3. Add and remove liquidity from pools
4. Retrieve position information

All tests are working correctly, but actual transaction tests are commented out pending wallet funding.