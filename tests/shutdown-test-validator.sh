#!/bin/bash

# Ensure the script exits on any error
set -e

# Log directory where PID file is stored
LOG_DIR="./test-ledger"
PID_FILE="$LOG_DIR/validator.pid"

# Display banner
echo -e "\n\033[1;36m========== Shutting Down Solana Test Validator ==========\033[0m"

# Check if PID file exists
if [ -f "$PID_FILE" ]; then
    # Read PID from file
    VALIDATOR_PID=$(cat "$PID_FILE")
    echo "Found validator process with PID: $VALIDATOR_PID"
    
    # Check if process is still running
    if ps -p $VALIDATOR_PID > /dev/null; then
        echo "Stopping validator process..."
        kill $VALIDATOR_PID
        
        # Wait for process to terminate
        ATTEMPTS=0
        MAX_ATTEMPTS=10
        while ps -p $VALIDATOR_PID > /dev/null; do
            ATTEMPTS=$((ATTEMPTS+1))
            if [ $ATTEMPTS -gt $MAX_ATTEMPTS ]; then
                echo -e "\033[1;31mProcess didn't terminate gracefully, forcing kill...\033[0m"
                kill -9 $VALIDATOR_PID || true
                break
            fi
            echo "Waiting for validator to terminate... (attempt $ATTEMPTS/$MAX_ATTEMPTS)"
            sleep 1
        done
        
        echo -e "\033[1;32m✓ Validator process terminated\033[0m"
    else
        echo -e "\033[1;33mValidator process is not running\033[0m"
    fi
    
    # Remove PID file
    rm -f "$PID_FILE"
    echo "Removed PID file: $PID_FILE"
else
    echo -e "\033[1;33mNo PID file found at $PID_FILE\033[0m"
    
    # Try to find and kill any validator process
    echo "Looking for any running validator process..."
    pkill -f solana-test-validator || true
fi

echo -e "\033[1;36m=========================================================\033[0m\n"