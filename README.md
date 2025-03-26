# DLMM Manager Server

A Node.js server for interacting with Meteora DLMM (Distributed Liquidity Market Maker) pools on the Solana blockchain.

## Features

- Fetch protocol metrics and pair data
- Get pool active bin information
- Retrieve user positions for specific pools
- Add and remove liquidity
- Perform swaps between tokens
- Move funds between pools

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
4. Edit the `.env` file with your preferred settings

## Usage

### Start the server

```bash
node index.js
```

### API Endpoints

- **Health Check**: `GET /health`
- **Protocol Metrics**: `GET /api/metrics`
- **All Pairs**: `GET /api/pairs`
- **Specific Pair**: `GET /api/pairs/:pairAddress`
- **Pool Active Bin**: `GET /api/pools/:poolAddress/active-bin`
- **User Positions**: `GET /api/users/:userAddress/pools/:poolAddress/positions`

## Services

### MeteoraDLMMKeeperService

Static service for fetching data from the Meteora API:
- Protocol metrics
- Pair information
- Position data

### MeteoraDLMMInteractionsService

Service for direct interactions with DLMM pools on the Solana blockchain:
- Initialize pools
- Get active bins
- Manage positions
- Add/remove liquidity
- Perform swaps

## Testing

The project includes several types of tests:

```bash
# Run simple tests (fast, reliable)
npm run test:simple

# Run tests with coverage reporting
npm run test:coverage

# Run fork tests with local Solana validator
npm run test:fork
```

For more details on testing, see the [tests/README.md](tests/README.md) file.

## Cleanup Script

A utility script is included to remove all liquidity and close all positions for a user:

```bash
node cleanup-positions.js
```

Note: This requires a valid Solana keypair in `id.json`.

## License

ISC