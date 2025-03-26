# DLMM Service Tests

This directory contains tests for the Meteora DLMM service files.

## Test Structure

The test suite is organized in two categories:

1. **Simple Tests** - Fast, reliable unit tests with mocks:
   - `MeteoraDLMMInteractionsServiceSimple.test.js` - Tests DLMM interactions with mocks
   - `MeteoraDLMMKeeperServiceSimple.test.js` - Tests API fetching with mocks

2. **Fork Tests** - Integration tests using a local Solana validator:
   - `MeteoraDLMMInteractionsServiceFork.test.js` - Tests DLMM interactions on a local blockchain

Additionally, some archived test files are kept for reference:
   - `MeteoraDLMMInteractionsService.test.js.bak` - Additional tests for the interaction service
   - `MeteoraDLMMKeeperService.test.js.bak` - Additional tests for the keeper service

## Running Tests

We provide several commands for running tests:

```bash
# Run only the simple tests (fast, reliable)
npm run test:simple

# Run tests with coverage reporting
npm run test:coverage

# Run fork tests with the test validator
npm run test:fork
```

You can also use the run-tests.sh script:

```bash
# Default (simple tests)
./tests/run-tests.sh

# Run simple tests only
./tests/run-tests.sh --simple

# Run fork tests with the test validator
./tests/run-tests.sh --fork
```

## Test Coverage

The tests cover the core functionality of both services:

1. **MeteoraDLMMKeeperService** - API fetching service
   - Protocol metrics retrieval
   - Pair data retrieval
   - Position and wallet data access
   - Error handling

2. **MeteoraDLMMInteractionsService** - DLMM interaction service
   - Pool initialization
   - Getting active bins
   - Retrieving user positions
   - Adding and removing liquidity
   - Moving funds between pools
   - Swapping tokens
   - Position management

## Fork Tests

The fork tests use a local Solana validator to test real interactions with the blockchain:

1. They automatically set up a local validator with cloned programs
2. Test the Trump/USDC pool that is cloned from mainnet
3. Perform read operations on the pool data
4. Provide helpful mocks for more complex operations

**Requirements for fork tests:**
- Solana CLI tools installed (`solana-test-validator` in your PATH)
- At least 2GB of memory for the validator process
- Internet connection (first run) to clone accounts from mainnet

**Validator setup:**
- The Trump token mint (`6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN`)
- USDC mint (`EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`)
- Trump/USDC pool (`9d9mb8kooFfaD3SctgZtkxQypkshx6ezhbKio89ixyy2`)
- DLMM program (`LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo`)

## Mocking

The simple tests use Jest's mocking capabilities:

- `@solana/web3.js` - Mocked for blockchain interactions
- `@meteora-ag/dlmm` - Mocked for DLMM pool operations
- `global.fetch` - Mocked for API calls

## Extending Tests

To add more tests:

1. For API tests, follow the pattern in `MeteoraDLMMKeeperServiceSimple.test.js`
2. For DLMM interaction tests, add to `MeteoraDLMMInteractionsServiceSimple.test.js`
3. For real blockchain tests, add to `MeteoraDLMMInteractionsServiceFork.test.js`