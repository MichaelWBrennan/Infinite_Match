import { ethers } from 'ethers';
import { Logger } from '../../core/logger/index.js';

const logger = new Logger('Web3Service');

export class Web3Service {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract | null = null;

  constructor() {
    // Initialize Web3 provider
    const rpcUrl = process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/your-project-id';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Initialize wallet
    const privateKey = process.env.WALLET_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('WALLET_PRIVATE_KEY environment variable is required');
    }
    this.wallet = new ethers.Wallet(privateKey, this.provider);
  }

  async initialize() {
    try {
      // Load contract ABI and address
      const contractAddress = process.env.NFT_CONTRACT_ADDRESS;
      const contractABI = this.getContractABI();
      
      if (contractAddress) {
        this.contract = new ethers.Contract(contractAddress, contractABI, this.wallet);
        logger.info('Web3 service initialized', { contractAddress });
      } else {
        logger.warn('NFT_CONTRACT_ADDRESS not set, Web3 features disabled');
      }
    } catch (error) {
      logger.error('Failed to initialize Web3 service', error);
      throw error;
    }
  }

  // NFT Management
  async mintNFT(playerId: string, tokenId: string, metadata: any): Promise<string> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      // Mint NFT
      const tx = await this.contract.mint(playerId, tokenId, metadata);
      await tx.wait();

      logger.info('NFT minted successfully', { playerId, tokenId, txHash: tx.hash });
      return tx.hash;
    } catch (error) {
      logger.error('Failed to mint NFT', error);
      throw error;
    }
  }

  async transferNFT(fromPlayerId: string, toPlayerId: string, tokenId: string): Promise<string> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const tx = await this.contract.transferFrom(fromPlayerId, toPlayerId, tokenId);
      await tx.wait();

      logger.info('NFT transferred successfully', { fromPlayerId, toPlayerId, tokenId, txHash: tx.hash });
      return tx.hash;
    } catch (error) {
      logger.error('Failed to transfer NFT', error);
      throw error;
    }
  }

  async getPlayerNFTs(playerId: string): Promise<any[]> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const balance = await this.contract.balanceOf(playerId);
      const nfts = [];

      for (let i = 0; i < balance; i++) {
        const tokenId = await this.contract.tokenOfOwnerByIndex(playerId, i);
        const metadata = await this.contract.tokenURI(tokenId);
        nfts.push({ tokenId: tokenId.toString(), metadata });
      }

      return nfts;
    } catch (error) {
      logger.error('Failed to get player NFTs', error);
      return [];
    }
  }

  // Token Management
  async getTokenBalance(playerId: string, tokenAddress: string): Promise<string> {
    try {
      const contract = new ethers.Contract(tokenAddress, this.getERC20ABI(), this.provider);
      const balance = await contract.balanceOf(playerId);
      return ethers.formatEther(balance);
    } catch (error) {
      logger.error('Failed to get token balance', error);
      return '0';
    }
  }

  async transferTokens(fromPlayerId: string, toPlayerId: string, amount: string, tokenAddress: string): Promise<string> {
    try {
      const contract = new ethers.Contract(tokenAddress, this.getERC20ABI(), this.wallet);
      const tx = await contract.transfer(toPlayerId, ethers.parseEther(amount));
      await tx.wait();

      logger.info('Tokens transferred successfully', { fromPlayerId, toPlayerId, amount, txHash: tx.hash });
      return tx.hash;
    } catch (error) {
      logger.error('Failed to transfer tokens', error);
      throw error;
    }
  }

  // Marketplace Integration
  async listNFTForSale(tokenId: string, price: string, seller: string): Promise<string> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const tx = await this.contract.listForSale(tokenId, ethers.parseEther(price), seller);
      await tx.wait();

      logger.info('NFT listed for sale', { tokenId, price, seller, txHash: tx.hash });
      return tx.hash;
    } catch (error) {
      logger.error('Failed to list NFT for sale', error);
      throw error;
    }
  }

  async buyNFT(tokenId: string, buyer: string, price: string): Promise<string> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const tx = await this.contract.buy(tokenId, buyer, { value: ethers.parseEther(price) });
      await tx.wait();

      logger.info('NFT purchased', { tokenId, buyer, price, txHash: tx.hash });
      return tx.hash;
    } catch (error) {
      logger.error('Failed to buy NFT', error);
      throw error;
    }
  }

  // Game Integration
  async createGameAsset(assetType: string, metadata: any): Promise<string> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const tx = await this.contract.createGameAsset(assetType, metadata);
      await tx.wait();

      logger.info('Game asset created', { assetType, txHash: tx.hash });
      return tx.hash;
    } catch (error) {
      logger.error('Failed to create game asset', error);
      throw error;
    }
  }

  async updateGameAsset(tokenId: string, newMetadata: any): Promise<string> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const tx = await this.contract.updateGameAsset(tokenId, newMetadata);
      await tx.wait();

      logger.info('Game asset updated', { tokenId, txHash: tx.hash });
      return tx.hash;
    } catch (error) {
      logger.error('Failed to update game asset', error);
      throw error;
    }
  }

  // Event Listening
  async listenToEvents() {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      // Listen for NFT minted events
      this.contract.on('NFTMinted', (playerId, tokenId, metadata, event) => {
        logger.info('NFT minted event received', { playerId, tokenId, metadata, txHash: event.transactionHash });
        this.handleNFTMinted(playerId, tokenId, metadata);
      });

      // Listen for NFT transferred events
      this.contract.on('NFTTransferred', (from, to, tokenId, event) => {
        logger.info('NFT transferred event received', { from, to, tokenId, txHash: event.transactionHash });
        this.handleNFTTransferred(from, to, tokenId);
      });

      // Listen for NFT sold events
      this.contract.on('NFTSold', (tokenId, seller, buyer, price, event) => {
        logger.info('NFT sold event received', { tokenId, seller, buyer, price, txHash: event.transactionHash });
        this.handleNFTSold(tokenId, seller, buyer, price);
      });

      logger.info('Web3 event listeners started');
    } catch (error) {
      logger.error('Failed to start event listeners', error);
    }
  }

  // Event Handlers
  private async handleNFTMinted(playerId: string, tokenId: string, metadata: any) {
    // Update player's NFT inventory in database
    // Send notification to player
    // Update analytics
  }

  private async handleNFTTransferred(from: string, to: string, tokenId: string) {
    // Update both players' NFT inventories
    // Send notifications
    // Update analytics
  }

  private async handleNFTSold(tokenId: string, seller: string, buyer: string, price: string) {
    // Update player balances
    // Transfer NFT ownership
    // Update marketplace listings
    // Send notifications
  }

  // Utility Methods
  private getContractABI() {
    return [
      "function mint(address to, uint256 tokenId, string memory metadata) public",
      "function transferFrom(address from, address to, uint256 tokenId) public",
      "function balanceOf(address owner) public view returns (uint256)",
      "function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256)",
      "function tokenURI(uint256 tokenId) public view returns (string memory)",
      "function listForSale(uint256 tokenId, uint256 price, address seller) public",
      "function buy(uint256 tokenId, address buyer) public payable",
      "function createGameAsset(string memory assetType, string memory metadata) public",
      "function updateGameAsset(uint256 tokenId, string memory metadata) public",
      "event NFTMinted(address indexed playerId, uint256 indexed tokenId, string metadata)",
      "event NFTTransferred(address indexed from, address indexed to, uint256 indexed tokenId)",
      "event NFTSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price)"
    ];
  }

  private getERC20ABI() {
    return [
      "function balanceOf(address owner) public view returns (uint256)",
      "function transfer(address to, uint256 amount) public returns (bool)",
      "function transferFrom(address from, address to, uint256 amount) public returns (bool)"
    ];
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; network: string; blockNumber: number }> {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      
      return {
        status: 'healthy',
        network: network.name,
        blockNumber
      };
    } catch (error) {
      logger.error('Web3 health check failed', error);
      return {
        status: 'unhealthy',
        network: 'unknown',
        blockNumber: 0
      };
    }
  }
}

export const web3Service = new Web3Service();
export default web3Service;