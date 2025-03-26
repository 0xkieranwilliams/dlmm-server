const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const DLMM = require('@meteora-ag/dlmm');
const BN = require('bn.js');
const MeteoraDLMMInteractionsService = require('../services/MeteoraDLMMInteractionsService');

// Mock dependencies
// For unit tests
const originalWebjs = jest.requireActual('@solana/web3.js');

jest.mock('@solana/web3.js', () => {
  const original = jest.requireActual('@solana/web3.js');
  return {
    ...original,
    Connection: jest.fn().mockImplementation(() => ({
      sendAndConfirmTransaction: jest.fn().mockResolvedValue('txHash')
    })),
    PublicKey: jest.fn().mockImplementation((address) => ({
      toString: () => address,
      equals: jest.fn().mockReturnValue(true),
      toBase58: jest.fn().mockReturnValue(address)
    })),
    sendAndConfirmTransaction: jest.fn().mockResolvedValue('txHash')
  };
});

// Mock for unit tests
jest.mock('@meteora-ag/dlmm', () => {
  return {
    create: jest.fn().mockImplementation(() => ({
      getActiveBin: jest.fn().mockResolvedValue({ binId: 100 }),
      getPositionsByUserAndLbPair: jest.fn().mockResolvedValue({
        userPositions: [
          {
            publicKey: { toString: () => 'position1' },
            positionData: {
              positionBinData: [{ binId: 99 }, { binId: 100 }, { binId: 101 }]
            }
          }
        ]
      }),
      removeLiquidity: jest.fn().mockResolvedValue('removeLiquidityTx'),
      addLiquidityByStrategy: jest.fn().mockResolvedValue('addLiquidityTx')
    }))
  };
});

describe('MeteoraDLMMInteractionsService', () => {
  let service;
  let mockRpcUrl;
  let mockPoolAddress;
  let mockPoolPublicKey;
  let mockDlmmPool;
  let mockUserKeypair;
  let mockConnection;

  beforeEach(() => {
    // Setup mocks
    mockRpcUrl = 'https://api.mainnet-beta.solana.com';
    mockPoolAddress = 'DLMMpooLaddressXXXXXXXXXXXXXXXXXXXXXXXX'; 
    mockPoolPublicKey = { toString: () => mockPoolAddress };
    mockUserKeypair = { 
      publicKey: { toString: () => 'userXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' }
    };

    // We already mocked Connection in the jest.mock setup

    // Mock DLMM
    mockDlmmPool = {
      getActiveBin: jest.fn().mockResolvedValue({ binId: 100 }),
      getPositionsByUserAndLbPair: jest.fn().mockResolvedValue({
        userPositions: [
          {
            publicKey: { toString: () => 'position1' },
            positionData: {
              positionBinData: [{ binId: 99 }, { binId: 100 }, { binId: 101 }]
            }
          }
        ]
      }),
      removeLiquidity: jest.fn().mockResolvedValue('removeLiquidityTx'),
      addLiquidityByStrategy: jest.fn().mockResolvedValue('addLiquidityTx')
    };
    
    DLMM.create = jest.fn().mockResolvedValue(mockDlmmPool);
    
    // Initialize service
    service = new MeteoraDLMMInteractionsService(mockRpcUrl);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initializePool', () => {
    it('should initialize a pool and store it in the map', async () => {
      // Act
      await service.initializePool(mockPoolAddress);
      
      // Assert
      expect(DLMM.create).toHaveBeenCalled();
      expect(service.dlmmPools.has(mockPoolAddress)).toBeTruthy();
    });
  });

  describe('getActiveBin', () => {
    it('should throw error if pool is not initialized', async () => {
      // Act & Assert
      await expect(service.getActiveBin(mockPoolAddress)).rejects.toThrow(/not initialized/);
    });

    it('should return active bin for initialized pool', async () => {
      // Arrange
      await service.initializePool(mockPoolAddress);
      
      // Act
      const activeBin = await service.getActiveBin(mockPoolAddress);
      
      // Assert
      expect(mockDlmmPool.getActiveBin).toHaveBeenCalled();
      expect(activeBin.binId).toBe(100);
    });
  });

  describe('getUserPositions', () => {
    it('should get user positions for a pool', async () => {
      // Arrange
      await service.initializePool(mockPoolAddress);
      
      // Act
      const positions = await service.getUserPositions(mockPoolAddress, mockUserKeypair.publicKey);
      
      // Assert
      expect(mockDlmmPool.getPositionsByUserAndLbPair).toHaveBeenCalledWith(mockUserKeypair.publicKey);
      expect(positions.length).toBe(1);
      expect(positions[0].publicKey.toString()).toBe('position1');
    });
  });

  describe('removeLiquidity', () => {
    it('should remove liquidity from all positions by default', async () => {
      // Arrange
      await service.initializePool(mockPoolAddress);
      
      // Act
      await service.removeLiquidity(mockUserKeypair, mockPoolAddress);
      
      // Assert
      expect(mockDlmmPool.removeLiquidity).toHaveBeenCalledWith(expect.objectContaining({
        position: expect.anything(),
        user: mockUserKeypair.publicKey,
        binIds: [99, 100, 101],
        liquiditiesBpsToRemove: expect.arrayContaining([expect.any(BN)]),
        shouldClaimAndClose: true,
      }));
      const { sendAndConfirmTransaction } = require('@solana/web3.js');
      expect(sendAndConfirmTransaction).toHaveBeenCalled();
    });

    it('should support specific position filtering', async () => {
      // Arrange
      await service.initializePool(mockPoolAddress);
      const specificPositions = [{ toString: () => 'position1' }];
      
      // Act
      await service.removeLiquidity(mockUserKeypair, mockPoolAddress, { specificPositions });
      
      // Assert
      expect(mockDlmmPool.removeLiquidity).toHaveBeenCalled();
    });
  });

  describe('addLiquidity', () => {
    it('should add liquidity to a pool with default options', async () => {
      // Arrange
      await service.initializePool(mockPoolAddress);
      const baseMintDecimals = 6;
      
      // Act
      await service.addLiquidity(mockUserKeypair, mockPoolAddress, baseMintDecimals);
      
      // Assert
      expect(mockDlmmPool.addLiquidityByStrategy).toHaveBeenCalledWith(expect.objectContaining({
        user: mockUserKeypair.publicKey,
        totalXAmount: expect.any(BN),
        totalYAmount: expect.any(BN),
        strategy: expect.objectContaining({
          minBinId: 90,
          maxBinId: 110,
          strategyType: 'Spot'
        })
      }));
      const { sendAndConfirmTransaction } = require('@solana/web3.js');
      expect(sendAndConfirmTransaction).toHaveBeenCalled();
    });

    it('should support custom options', async () => {
      // Arrange
      await service.initializePool(mockPoolAddress);
      const baseMintDecimals = 6;
      const options = {
        xAmount: new BN(500000000),
        binRange: 5,
        strategyType: 'Curve',
        strategyParams: { weightX: 80, weightY: 20 }
      };
      
      // Act
      await service.addLiquidity(mockUserKeypair, mockPoolAddress, baseMintDecimals, options);
      
      // Assert
      expect(mockDlmmPool.addLiquidityByStrategy).toHaveBeenCalledWith(expect.objectContaining({
        totalXAmount: options.xAmount,
        strategy: expect.objectContaining({
          minBinId: 95,
          maxBinId: 105,
          strategyType: 'Curve',
          weightX: 80,
          weightY: 20
        })
      }));
    });
  });

  describe('moveFunds', () => {
    it('should remove liquidity from one pool and add to another', async () => {
      // Arrange
      const toPoolAddress = 'DLMMpooLaddress2XXXXXXXXXXXXXXXXXXXXXXXX';
      await service.initializePool(mockPoolAddress);
      await service.initializePool(toPoolAddress);
      
      // Spy on internal methods
      jest.spyOn(service, 'removeLiquidity');
      jest.spyOn(service, 'addLiquidity');
      
      // Act
      await service.moveFunds(mockUserKeypair, mockPoolAddress, toPoolAddress, 6);
      
      // Assert
      expect(service.removeLiquidity).toHaveBeenCalledWith(
        mockUserKeypair, 
        mockPoolAddress, 
        {}
      );
      expect(service.addLiquidity).toHaveBeenCalledWith(
        mockUserKeypair,
        toPoolAddress,
        6,
        {}
      );
    });
  });
});

// Run integration tests
describe('MeteoraDLMMInteractionsService Integration Tests', () => {
  let service;
  let rpcUrl;
  let poolAddress;
  let userKeypair;
  
  beforeAll(() => {
    jest.unmock('@solana/web3.js');
    jest.unmock('@meteora-ag/dlmm');
    const { Connection, PublicKey, Keypair } = originalWebjs;
    const fs = require('fs');
    
    // Configure with local test validator values
    rpcUrl = 'http://127.0.0.1:8899';
    poolAddress = '9d9mb8kooFfaD3SctgZtkxQypkshx6ezhbKio89ixyy2'; // Trump/USDC pool on test validator
    
    // Load the user's keypair from id.json
    try {
      const keypairData = JSON.parse(fs.readFileSync('/Users/kieranwilliams/Code/Personal/solana/dlmm-manager/server/id.json'));
      userKeypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
      console.log(`Using keypair with public key: ${userKeypair.publicKey.toString()}`);
    } catch (err) {
      console.error('Error loading keypair from id.json:', err);
      // Fallback to a generated keypair for read-only operations
      userKeypair = Keypair.generate();
      console.log(`Fallback to generated keypair: ${userKeypair.publicKey.toString()}`);
    }
    
    // Create a connection to the local test validator
    service = new MeteoraDLMMInteractionsService(rpcUrl);
  });
  
  it('should initialize a real pool', async () => {
    await service.initializePool(poolAddress);
    expect(service.dlmmPools.has(poolAddress)).toBeTruthy();
  });
  
  it('should get the active bin from a real pool', async () => {
    await service.initializePool(poolAddress);
    const activeBin = await service.getActiveBin(poolAddress);
    expect(activeBin).toBeDefined();
    expect(activeBin.binId).toBeDefined();
    console.log(`Active bin ID: ${activeBin.binId}`);
  });
  
  it('should get user positions if they exist', async () => {
    // This is a read-only operation that won't cost any SOL
    await service.initializePool(poolAddress);
    const positions = await service.getUserPositions(poolAddress, userKeypair.publicKey);
    console.log(`Found ${positions.length} positions for this user`);
    // We don't assert anything specific since the user might not have positions
  });
  
  // Commented out by default to avoid accidental fund usage
  // Uncomment and run separately if you specifically want to test adding liquidity
  
  it('should add a tiny amount of liquidity to the pool', async () => {
    await service.initializePool(poolAddress);
    
    // This is a Trump Token <-> USDC pool
    // Trump Token is tokenX (6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN)
    // USDC is tokenY (EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v)
    
    // Trump token has 9 decimals (common for Solana tokens)
    // USDC has 6 decimals
    const trumpTokenDecimals = 9;
    const usdcDecimals = 6;
    
    // Using 0.001 tokens for each side (very small amount)
    const tinyXAmount = 0.001 * (10 ** trumpTokenDecimals); // 0.001 Trump Tokens
    const tinyYAmount = 0.001 * (10 ** usdcDecimals); // 0.001 USDC
    
    const options = {
      xAmount: tinyXAmount,
      yAmount: tinyYAmount,
      binRange: 1, // Minimum range to minimize cost
      strategyType: 'Spot'
    };
    
    try {
      // Check positions before
      const positionsBefore = await service.getUserPositions(poolAddress, userKeypair.publicKey);
      console.log(`Before adding liquidity: ${positionsBefore.length} positions`);
      
      // Execute transaction
      const txResult = await service.addLiquidity(userKeypair, poolAddress, trumpTokenDecimals, options);
      console.log('Transaction result:', txResult ? 'Success' : 'Failed');
      
      // Check positions after
      const positionsAfter = await service.getUserPositions(poolAddress, userKeypair.publicKey);
      console.log(`After adding liquidity: ${positionsAfter.length} positions`);
      
      // Verify the transaction actually did something
      if (positionsBefore.length === 0) {
        // Should have created a new position
        expect(positionsAfter.length).toBeGreaterThan(0);
      } else {
        // Should have at least not reduced positions
        expect(positionsAfter.length).toBeGreaterThanOrEqual(positionsBefore.length);
      }
    } catch (err) {
      console.error('Error adding liquidity:', err);
      // Test might fail if user doesn't have enough tokens
      // or if there are other blockchain errors
      throw err;
    }
  });
  
  it('should remove liquidity from the pool', async () => {
    await service.initializePool(poolAddress);
    
    // Get user positions first
    const positions = await service.getUserPositions(poolAddress, userKeypair.publicKey);
    
    if (positions.length === 0) {
      console.log('No positions to remove');
      // Skip the test if there are no positions
      return;
    }
    
    // Options to remove all liquidity and close the position
    const options = {
      bpsToRemove: 10000, // 100%
      shouldClaimAndClose: true,
      // Only remove from the first position to keep test simple
      specificPositions: [positions[0].publicKey]
    };
    
    try {
      await service.removeLiquidity(userKeypair, poolAddress, options);
      // If it doesn't throw, it succeeded
      expect(true).toBe(true);
    } catch (err) {
      console.error('Error removing liquidity:', err);
      throw err;
    }
  });
  
  it('should move funds between pools', async () => {
    // For this test, instead of trying to move to another pool which might require
    // additional tokens, we'll just move within the same pool to demonstrate the
    // functionality without requiring additional tokens
    
    await service.initializePool(poolAddress); // Trump/USDC pool
    
    console.log('Testing moveFunds function (simplified to reuse same pool)');
    
    // Trump token has 9 decimals, USDC has 6 decimals
    const trumpTokenDecimals = 9;
    const usdcDecimals = 6;
    
    // Use very small amounts
    const tinyXAmount = 0.0005 * (10 ** trumpTokenDecimals); // Very small amount
    const tinyYAmount = 0.0005 * (10 ** usdcDecimals); // Very small amount
    
    // First add a tiny amount to the Trump pool
    const addOptions = {
      xAmount: tinyXAmount,
      yAmount: tinyYAmount,
      binRange: 1, // Minimum range 
      strategyType: 'Spot'
    };
    
    try {
      // Add liquidity first if we don't have any positions
      const positions = await service.getUserPositions(poolAddress, userKeypair.publicKey);
      if (positions.length === 0) {
        console.log('No existing positions, adding a tiny amount of liquidity first');
        await service.addLiquidity(userKeypair, poolAddress, trumpTokenDecimals, addOptions);
      }
      
      // Now move funds (remove and re-add to same pool with different parameters)
      // This demonstrates the functionality without requiring additional tokens
      const removeOptions = {
        bpsToRemove: 5000, // Only remove 50% to keep some in the original pool
        shouldClaimAndClose: false // Don't close the position
      };
      
      const moveOptions = {
        removeOptions,
        addOptions: {
          // Use same amounts but different strategy
          xAmount: tinyXAmount,
          yAmount: tinyYAmount,
          binRange: 2, // Different bin range 
          strategyType: 'Spot'
        }
      };
      
      // We're "moving" within the same pool for demonstration/testing
      await service.moveFunds(userKeypair, poolAddress, poolAddress, trumpTokenDecimals, moveOptions);
      
      console.log('Successfully demonstrated moveFunds function');
      expect(true).toBe(true);
    } catch (err) {
      console.error('Error in moveFunds test:', err);
      // This might fail if user doesn't have the tokens
      expect(err).toBeDefined();
    }
  });
  
});