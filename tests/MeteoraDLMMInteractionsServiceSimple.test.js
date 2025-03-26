const MeteoraDLMMInteractionsService = require('../services/MeteoraDLMMInteractionsService');

// Mock dependencies
jest.mock('@solana/web3.js', () => {
  // Create a mock PublicKey implementation
  const MockPublicKey = function(address) {
    return {
      toString: () => address,
      equals: jest.fn().mockReturnValue(true),
      toBase58: jest.fn().mockReturnValue(address)
    };
  };
  
  return {
    Connection: jest.fn().mockImplementation(() => ({
      sendAndConfirmTransaction: jest.fn().mockResolvedValue('txHash')
    })),
    PublicKey: MockPublicKey,
    Keypair: {
      generate: jest.fn().mockReturnValue({
        publicKey: {
          toString: () => 'mockPublicKey',
          toBase58: () => 'mockPublicKey'
        }
      })
    },
    sendAndConfirmTransaction: jest.fn().mockResolvedValue('txHash')
  };
});

// Mock BN before importing it into the mocks
jest.mock('bn.js', () => {
  return jest.fn().mockImplementation((value) => {
    return {
      toString: () => value.toString(),
      toNumber: () => Number(value)
    };
  });
});

jest.mock('@meteora-ag/dlmm', () => {
  const mockBN = require('bn.js');
  
  // Create a mock function to create publicKey objects
  const mockPublicKey = (value) => ({
    toString: () => value,
    equals: jest.fn().mockReturnValue(true),
    toBase58: jest.fn().mockReturnValue(value)
  });
  
  return {
    create: jest.fn().mockImplementation(() => ({
      getActiveBin: jest.fn().mockResolvedValue({ binId: 100 }),
      getPositionsByUserAndLbPair: jest.fn().mockResolvedValue({
        userPositions: [
          {
            publicKey: mockPublicKey('position1'),
            positionData: {
              positionBinData: [{ binId: 99 }, { binId: 100 }, { binId: 101 }]
            }
          }
        ]
      }),
      removeLiquidity: jest.fn().mockResolvedValue('removeLiquidityTx'),
      addLiquidityByStrategy: jest.fn().mockResolvedValue('addLiquidityTx'),
      claimAllSwapFee: jest.fn().mockResolvedValue('claimFeeTx'),
      closePosition: jest.fn().mockResolvedValue('closePositionTx'),
      getBinArrayForSwap: jest.fn().mockResolvedValue(['bin1', 'bin2']),
      swapQuote: jest.fn().mockResolvedValue({
        binArraysPubkey: ['bin1', 'bin2'],
        minOutAmount: new mockBN(90)
      }),
      swap: jest.fn().mockResolvedValue('swapTx'),
      tokenX: { publicKey: mockPublicKey('tokenX') },
      tokenY: { publicKey: mockPublicKey('tokenY') },
      pubkey: mockPublicKey('poolPubkey')
    }))
  };
});

describe('MeteoraDLMMInteractionsService Simple Tests', () => {
  let service;
  let mockPoolAddress;
  let mockUserKeypair;
  let BN;
  
  beforeEach(() => {
    // Setup test data with local validator
    const mockRpcUrl = 'http://127.0.0.1:8899';
    mockPoolAddress = '9d9mb8kooFfaD3SctgZtkxQypkshx6ezhbKio89ixyy2'; // Trump/USDC pool
    mockUserKeypair = { 
      publicKey: { toString: () => 'user123' }
    };
    
    // Create service
    service = new MeteoraDLMMInteractionsService(mockRpcUrl);
    
    // Clear mocks
    jest.clearAllMocks();
    
    // Get the mocked BN
    BN = require('bn.js');
  });
  
  test('initializePool should create and store a DLMM pool', async () => {
    // Act
    await service.initializePool(mockPoolAddress);
    
    // Assert
    expect(service.dlmmPools.has(mockPoolAddress)).toBe(true);
    const DLMM = require('@meteora-ag/dlmm');
    expect(DLMM.create).toHaveBeenCalled();
  });
  
  test('checkPool should throw error if pool not initialized', () => {
    // Act & Assert
    expect(() => service.checkPool('nonexistent')).toThrow(/not initialized/);
  });
  
  test('getActiveBin should return active bin for initialized pool', async () => {
    // Arrange
    await service.initializePool(mockPoolAddress);
    
    // Act
    const result = await service.getActiveBin(mockPoolAddress);
    
    // Assert
    expect(result).toBeDefined();
    expect(result.binId).toBe(100);
  });
  
  test('getUserPositions should return positions for a user', async () => {
    // Arrange
    await service.initializePool(mockPoolAddress);
    
    // Act
    const positions = await service.getUserPositions(mockPoolAddress, mockUserKeypair.publicKey);
    
    // Assert
    expect(positions).toHaveLength(1);
    expect(positions[0].publicKey.toString()).toBe('position1');
  });

  // Tests for position management
  test('addLiquidity should call the correct methods', async () => {
    // Arrange
    await service.initializePool(mockPoolAddress);
    const baseMintDecimals = 6;
    
    // Act
    const result = await service.addLiquidity(mockUserKeypair, mockPoolAddress, baseMintDecimals);
    
    // Assert
    const dlmmPool = service.dlmmPools.get(mockPoolAddress);
    expect(dlmmPool.addLiquidityByStrategy).toHaveBeenCalled();
    expect(result).toBe("Successfully added liquidity");
  });
  
  test('removeLiquidity should call the correct methods', async () => {
    // Arrange
    await service.initializePool(mockPoolAddress);
    
    // Act
    const result = await service.removeLiquidity(mockUserKeypair, mockPoolAddress);
    
    // Assert
    const dlmmPool = service.dlmmPools.get(mockPoolAddress);
    expect(dlmmPool.removeLiquidity).toHaveBeenCalled();
    expect(result).toBe("Successfully removed liquidity");
  });
  
  test('claimSwapFees should call the correct methods', async () => {
    // Arrange
    await service.initializePool(mockPoolAddress);
    
    // Act
    const result = await service.claimSwapFees(mockUserKeypair, mockPoolAddress);
    
    // Assert
    const dlmmPool = service.dlmmPools.get(mockPoolAddress);
    expect(dlmmPool.claimAllSwapFee).toHaveBeenCalled();
    expect(result).toBe("Successfully claimed swap fees");
  });
  
  test('closePositions should call the correct methods', async () => {
    // Arrange
    await service.initializePool(mockPoolAddress);
    
    // Act
    const result = await service.closePositions(mockUserKeypair, mockPoolAddress);
    
    // Assert
    const dlmmPool = service.dlmmPools.get(mockPoolAddress);
    expect(dlmmPool.closePosition).toHaveBeenCalled();
    expect(result).toBe("Successfully closed positions");
  });
  
  test('createBalancedPosition should call addLiquidity with correct parameters', async () => {
    // Arrange
    await service.initializePool(mockPoolAddress);
    const baseMintDecimals = 6;
    jest.spyOn(service, 'addLiquidity');
    
    // Act
    await service.createBalancedPosition(mockUserKeypair, mockPoolAddress, baseMintDecimals);
    
    // Assert
    expect(service.addLiquidity).toHaveBeenCalledWith(
      mockUserKeypair,
      mockPoolAddress,
      baseMintDecimals,
      expect.objectContaining({
        binRange: 10,
        strategyType: 'Spot'
      })
    );
  });
  
  test('createImbalancedPosition should call addLiquidity with correct parameters', async () => {
    // Arrange
    await service.initializePool(mockPoolAddress);
    const baseMintDecimals = 6;
    jest.spyOn(service, 'addLiquidity');
    const options = {
      xAmount: 100000000,
      yAmount: 50000000
    };
    
    // Act
    await service.createImbalancedPosition(mockUserKeypair, mockPoolAddress, baseMintDecimals, options);
    
    // Assert
    expect(service.addLiquidity).toHaveBeenCalledWith(
      mockUserKeypair,
      mockPoolAddress,
      baseMintDecimals,
      expect.objectContaining({
        xAmount: options.xAmount,
        yAmount: options.yAmount
      })
    );
  });
  
  test('createOneSidedPosition should call addLiquidity with correct parameters', async () => {
    // Arrange
    await service.initializePool(mockPoolAddress);
    const baseMintDecimals = 6;
    jest.spyOn(service, 'addLiquidity');
    const options = {
      xAmount: 100000000,
      isXSide: true
    };
    
    // Act
    await service.createOneSidedPosition(mockUserKeypair, mockPoolAddress, baseMintDecimals, options);
    
    // Assert
    expect(service.addLiquidity).toHaveBeenCalledWith(
      mockUserKeypair,
      mockPoolAddress,
      baseMintDecimals,
      expect.objectContaining({
        xAmount: options.xAmount,
        strategyType: 'Spot',
        strategyParams: expect.objectContaining({
          minBinId: expect.any(Number),
          maxBinId: expect.any(Number)
        })
      })
    );
  });
  
  test('swap should execute a swap transaction', async () => {
    // Arrange
    await service.initializePool(mockPoolAddress);
    const amount = 1000000;
    const isXtoY = true;
    
    // Mock sendAndConfirmTransaction for this specific test
    const { sendAndConfirmTransaction } = require('@solana/web3.js');
    
    // Act
    const result = await service.swap(mockUserKeypair, mockPoolAddress, amount, isXtoY);
    
    // Assert
    const dlmmPool = service.dlmmPools.get(mockPoolAddress);
    expect(dlmmPool.getBinArrayForSwap).toHaveBeenCalled();
    expect(dlmmPool.swapQuote).toHaveBeenCalled();
    expect(dlmmPool.swap).toHaveBeenCalled();
    expect(sendAndConfirmTransaction).toHaveBeenCalled();
    expect(result).toBe('txHash');
  });
  
  test('moveFunds should call removeLiquidity and addLiquidity', async () => {
    // Arrange
    const toPoolAddress = 'pool456';
    await service.initializePool(mockPoolAddress);
    await service.initializePool(toPoolAddress);
    const baseMintDecimals = 6;
    
    // Spy on methods
    jest.spyOn(service, 'removeLiquidity').mockResolvedValue('removed');
    jest.spyOn(service, 'addLiquidity').mockResolvedValue('added');
    
    // Act
    const result = await service.moveFunds(mockUserKeypair, mockPoolAddress, toPoolAddress, baseMintDecimals);
    
    // Assert
    expect(service.removeLiquidity).toHaveBeenCalledWith(mockUserKeypair, mockPoolAddress, {});
    expect(service.addLiquidity).toHaveBeenCalledWith(mockUserKeypair, toPoolAddress, baseMintDecimals, {});
    expect(result).toEqual(expect.objectContaining({
      success: true,
      message: expect.stringContaining('Successfully moved funds')
    }));
  });
});