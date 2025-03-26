const { PublicKey, Connection, Keypair } = require('@solana/web3.js');
const DLMM = require('@meteora-ag/dlmm');
const fs = require('fs');

async function getPoolDetails() {
  try {
    // Load keypair
    const keypairData = JSON.parse(fs.readFileSync('/Users/kieranwilliams/Code/Personal/solana/dlmm-manager/server/id.json'));
    const userKeypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
    console.log('Using keypair with public key:', userKeypair.publicKey.toString());
    
    const rpcUrl = 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');
    const poolAddress = new PublicKey('71HuFmuYAFEFUna2x2R4HJjrFNQHGuagW3gUMFToL9tk');
    
    console.log('Initializing pool...');
    const dlmmPool = await DLMM.default.create(connection, poolAddress);
    
    console.log('Getting pool details...');
    const activeBin = await dlmmPool.getActiveBin();
    
    // DLMM library seems to have a different structure than expected
    // Let's check what methods and properties are available
    console.log('\nAvailable methods on dlmmPool:', Object.keys(dlmmPool));
    
    // Directly inspect lbPair instead
    console.log('\nLB Pair properties:', Object.keys(dlmmPool.lbPair));
    
    console.log('Pool address:', poolAddress.toString());
    console.log('Active bin ID:', activeBin.binId);
    
    // Get token addresses from lbPair
    const tokenXMint = dlmmPool.lbPair.tokenXMint.toString();
    const tokenYMint = dlmmPool.lbPair.tokenYMint.toString();
    
    console.log('Token X address:', tokenXMint);
    console.log('Token Y address:', tokenYMint);
    
    // Check if token is Trump token
    const trumpTokenAddress = '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN';
    console.log('Trump token address:', trumpTokenAddress);
    if (tokenXMint === trumpTokenAddress) {
      console.log('Trump token is tokenX in this pool');
    } else if (tokenYMint === trumpTokenAddress) {
      console.log('Trump token is tokenY in this pool');
    } else {
      console.log('Trump token not found in this pool');
    }
    
    // Check user positions
    console.log('\nChecking user positions...');
    const { userPositions } = await dlmmPool.getPositionsByUserAndLbPair(userKeypair.publicKey);
    console.log(`Found ${userPositions.length} positions for this user`);
    
    if (userPositions.length > 0) {
      console.log('\nPosition details:');
      userPositions.forEach((position, index) => {
        console.log(`Position ${index + 1} (${position.publicKey.toString()}):`);
        console.log(`- Liquidity: ${position.positionData.liquidityShares}`);
        console.log(`- Bin range: ${position.positionData.lowerBinId} to ${position.positionData.upperBinId}`);
        console.log(`- Number of bins: ${position.positionData.positionBinData.length}`);
      });
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

getPoolDetails();