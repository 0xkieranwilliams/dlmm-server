const MeteoraDLMMKeeperService = require('../services/MeteoraDLMMKeeperService');

// Mock the fetch function globally
global.fetch = jest.fn();

describe('MeteoraDLMMKeeperService', () => {
  // Mock successful response
  const mockSuccessResponse = { success: true, data: [{ id: 1 }] };
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup the default successful response
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockSuccessResponse)
    });
  });

  describe('API Methods', () => {
    test('getProtocolMetrics should fetch from the correct endpoint', async () => {
      // Act
      const result = await MeteoraDLMMKeeperService.getProtocolMetrics();
      
      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(String(global.fetch.mock.calls[0][0])).toContain('/info/protocol_metrics');
      expect(result).toEqual(mockSuccessResponse);
    });

    test('getAllPairs should pass include_unknown parameter', async () => {
      // Act
      await MeteoraDLMMKeeperService.getAllPairs(false);
      
      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(String(global.fetch.mock.calls[0][0])).toContain('include_unknown=false');
    });

    test('getPair should fetch a specific pair by address', async () => {
      // Arrange
      const pairAddress = 'test_pair_address';
      
      // Act
      await MeteoraDLMMKeeperService.getPair(pairAddress);
      
      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(String(global.fetch.mock.calls[0][0])).toContain(`/pair/${pairAddress}`);
    });

    test('getWalletEarning should use wallet and pair addresses', async () => {
      // Arrange
      const walletAddress = 'wallet123';
      const pairAddress = 'pair456';
      
      // Act
      await MeteoraDLMMKeeperService.getWalletEarning(walletAddress, pairAddress);
      
      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(String(global.fetch.mock.calls[0][0])).toContain(`/wallet/${walletAddress}/${pairAddress}/earning`);
    });
  });

  describe('Error Handling', () => {
    test('should throw an error when API returns non-ok response', async () => {
      // Arrange
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: jest.fn().mockResolvedValue('Not Found')
      });
      
      // Act & Assert
      await expect(MeteoraDLMMKeeperService.getProtocolMetrics()).rejects.toThrow('API Error 404');
    });

    test('should handle network errors', async () => {
      // Arrange
      global.fetch.mockRejectedValueOnce(new Error('Network Error'));
      
      // Act & Assert
      await expect(MeteoraDLMMKeeperService.getProtocolMetrics()).rejects.toThrow('Network Error');
    });
  });
});