#!/bin/bash

# Display a heading with color
heading() {
  echo -e "\n\033[1;36m------------ $1 ------------\033[0m\n"
}

# Run the command and get exit code
run_test() {
  echo -e "Running: \033[1m$1\033[0m"
  eval $1
  local exit_code=$?
  if [ $exit_code -eq 0 ]; then
    echo -e "\033[1;32mTest Passed! ✓\033[0m"
  else
    echo -e "\033[1;31mTest Failed! ✗\033[0m"
    # Don't exit, just continue with other tests
  fi
  echo ""
  return $exit_code
}

# Check if Solana test validator is available
check_solana() {
  if ! command -v solana-test-validator &> /dev/null; then
    echo -e "\033[1;31mError: solana-test-validator not found in PATH\033[0m"
    echo "Fork tests require the Solana CLI tools to be installed."
    echo "Visit https://docs.solanalabs.com/cli/install for installation instructions."
    return 1
  fi
  return 0
}

# Check if an argument was provided
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
  echo "Usage: ./run-tests.sh [option]"
  echo "Options:"
  echo "  --simple         Run simple tests only (default)"
  echo "  --fork           Run fork tests with the test validator"
  exit 0
fi

# Change to the server directory
cd "$(dirname "$0")/.."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Default to simple tests if no argument provided
TEST_TYPE=${1:-"--simple"}

case $TEST_TYPE in
  "--simple")
    heading "RUNNING SIMPLE TESTS"
    run_test "npx jest tests/MeteoraDLMMInteractionsServiceSimple.test.js tests/MeteoraDLMMKeeperServiceSimple.test.js"
    ;;
  
  "--fork")
    heading "RUNNING FORK TESTS (with local validator)"
    # Check if Solana CLI is available
    if ! check_solana; then
      exit 1
    fi
    
    # Check if validator is running
    if ! nc -z localhost 8899 >/dev/null 2>&1; then
      echo -e "\033[1;33mLocal validator not detected on port 8899. Starting validator...\033[0m"
      bash ./tests/setup-test-validator.sh
      STARTED_VALIDATOR=true
    fi
    
    run_test "npx jest --forceExit tests/MeteoraDLMMInteractionsServiceFork.test.js"
    
    # Shutdown the validator if we started it
    if [ "$STARTED_VALIDATOR" = true ]; then
      echo -e "\033[1;33mShutting down validator...\033[0m"
      bash ./tests/shutdown-test-validator.sh
    fi
    ;;
  
  *)
    echo -e "\033[1;31mUnknown option: $TEST_TYPE\033[0m"
    echo "Run ./run-tests.sh --help for usage information"
    exit 1
    ;;
esac

echo -e "\n\033[1;32mTest runs completed!\033[0m"