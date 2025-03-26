#!/bin/bash

# Ensure the script exits on any error
set -e

# Configurable parameters
SOLANA_URL=${SOLANA_URL:-"https://api.mainnet-beta.solana.com"}
DLMM_PROGRAM_ID=${DLMM_PROGRAM_ID:-"LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo"}
TRUMP_TOKEN_MINT=${TRUMP_TOKEN_MINT:-"6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN"}
USDC_MINT=${USDC_MINT:-"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"}
TRUMP_USDC_POOL=${TRUMP_USDC_POOL:-"9d9mb8kooFfaD3SctgZtkxQypkshx6ezhbKio89ixyy2"}
SOLANA_PORT=${SOLANA_PORT:-8899}
SOLANA_WS_PORT=${SOLANA_WS_PORT:-8900}

# Create a log directory
LOG_DIR="./test-ledger"
mkdir -p $LOG_DIR

# Display banner
echo -e "\n\033[1;36m========== Starting Solana Test Validator ==========\033[0m"
echo -e "• Cloning DLMM Program: \033[1m$DLMM_PROGRAM_ID\033[0m"
echo -e "• Cloning Trump Token: \033[1m$TRUMP_TOKEN_MINT\033[0m"
echo -e "• Cloning USDC: \033[1m$USDC_MINT\033[0m"
echo -e "• Cloning Trump/USDC Pool: \033[1m$TRUMP_USDC_POOL\033[0m"
echo -e "• RPC URL: \033[1mhttp://127.0.0.1:$SOLANA_PORT\033[0m"
echo -e "• WebSocket URL: \033[1mws://127.0.0.1:$((SOLANA_PORT+1))\033[0m"
echo -e "\033[1;36m====================================================\033[0m\n"

# Kill any existing validator process
echo "Checking for existing validator process..."
pkill -f solana-test-validator || true
sleep 2 # Give time for processes to exit

# Start the test validator with the specific accounts cloned from mainnet
echo "Starting Solana test validator..."
solana-test-validator \
  --url $SOLANA_URL \
  --clone $DLMM_PROGRAM_ID \
  --clone $TRUMP_TOKEN_MINT \
  --clone $USDC_MINT \
  --clone $TRUMP_USDC_POOL \
  --rpc-port $SOLANA_PORT \
  --reset &

VALIDATOR_PID=$!
echo "Validator PID: $VALIDATOR_PID"

# Wait for validator to start
echo "Waiting for validator to start..."
ATTEMPTS=0
MAX_ATTEMPTS=30

while ! curl -s "http://127.0.0.1:$SOLANA_PORT" -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' | grep -q "ok"; do
  ATTEMPTS=$((ATTEMPTS+1))
  if [ $ATTEMPTS -gt $MAX_ATTEMPTS ]; then
    echo "Timed out waiting for validator to start"
    kill $VALIDATOR_PID
    exit 1
  fi
  echo "Waiting for validator... (attempt $ATTEMPTS/$MAX_ATTEMPTS)"
  sleep 1
done

echo -e "\n\033[1;32m✓ Validator started successfully!\033[0m"
echo "Validator is running in the background with PID: $VALIDATOR_PID"
echo "To stop the validator manually, run: kill $VALIDATOR_PID"
echo -e "Test validator logs are available at: $LOG_DIR/validator.log\n"

# Save PID to a file for later cleanup
echo $VALIDATOR_PID > $LOG_DIR/validator.pid
echo "PID saved to $LOG_DIR/validator.pid"

# Display connection information
echo -e "\n\033[1m=== Test Validator Connection Information ===\033[0m"
echo "JSON RPC URL: http://127.0.0.1:$SOLANA_PORT"
echo "WebSocket URL: ws://127.0.0.1:$((SOLANA_PORT+1))"
echo -e "Use these URLs in your tests to connect to the local validator\n"