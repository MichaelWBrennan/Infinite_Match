using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Evergreen.Blockchain
{
    [System.Serializable]
    public class NFT
    {
        public string tokenId;
        public string contractAddress;
        public string ownerAddress;
        public string name;
        public string description;
        public string imageUrl;
        public string animationUrl;
        public NFTMetadata metadata;
        public List<NFTAttribute> attributes = new List<NFTAttribute>();
        public NFTType nftType;
        public Rarity rarity;
        public int level;
        public int experience;
        public bool isStaked;
        public DateTime mintedAt;
        public DateTime lastTransferred;
        public float value;
        public string currency;
    }
    
    [System.Serializable]
    public class NFTMetadata
    {
        public string name;
        public string description;
        public string image;
        public string animation_url;
        public string external_url;
        public Dictionary<string, object> properties = new Dictionary<string, object>();
        public List<NFTAttribute> attributes = new List<NFTAttribute>();
    }
    
    [System.Serializable]
    public class NFTAttribute
    {
        public string trait_type;
        public string value;
        public float rarity_percentage;
        public int max_value;
        public int min_value;
    }
    
    public enum NFTType
    {
        Character,
        Equipment,
        Vehicle,
        Building,
        Land,
        Artwork,
        Music,
        Video,
        Collectible,
        Utility
    }
    
    public enum Rarity
    {
        Common,
        Uncommon,
        Rare,
        Epic,
        Legendary,
        Mythic,
        Unique
    }
    
    [System.Serializable]
    public class SmartContract
    {
        public string contractAddress;
        public string name;
        public ContractType contractType;
        public string abi;
        public string bytecode;
        public string network;
        public bool isVerified;
        public DateTime deployedAt;
        public Dictionary<string, object> functions = new Dictionary<string, object>();
    }
    
    public enum ContractType
    {
        ERC721,
        ERC1155,
        ERC20,
        Marketplace,
        Staking,
        Governance,
        LootBox,
        Auction,
        Rental,
        Custom
    }
    
    [System.Serializable]
    public class Wallet
    {
        public string address;
        public string privateKey;
        public string publicKey;
        public WalletType walletType;
        public bool isConnected;
        public DateTime lastUsed;
        public Dictionary<string, float> balances = new Dictionary<string, float>();
        public List<string> nfts = new List<string>();
        public List<Transaction> transactions = new List<Transaction>();
    }
    
    public enum WalletType
    {
        MetaMask,
        WalletConnect,
        Coinbase,
        Trust,
        Phantom,
        Solflare,
        Custom
    }
    
    [System.Serializable]
    public class Transaction
    {
        public string transactionHash;
        public string fromAddress;
        public string toAddress;
        public float amount;
        public string currency;
        public TransactionType transactionType;
        public TransactionStatus status;
        public float gasUsed;
        public float gasPrice;
        public float fee;
        public DateTime timestamp;
        public int blockNumber;
        public string data;
        public Dictionary<string, object> metadata = new Dictionary<string, object>();
    }
    
    public enum TransactionType
    {
        Transfer,
        Mint,
        Burn,
        Buy,
        Sell,
        Stake,
        Unstake,
        Claim,
        Bid,
        AcceptBid,
        CancelBid,
        CreateAuction,
        EndAuction,
        Rent,
        Return
    }
    
    public enum TransactionStatus
    {
        Pending,
        Confirmed,
        Failed,
        Cancelled
    }
    
    [System.Serializable]
    public class Marketplace
    {
        public string marketplaceId;
        public string name;
        public string description;
        public MarketplaceType marketplaceType;
        public float feePercentage;
        public List<string> supportedCurrencies = new List<string>();
        public List<string> supportedNFTs = new List<string>();
        public bool isActive;
        public DateTime created;
        public Dictionary<string, object> settings = new Dictionary<string, object>();
    }
    
    public enum MarketplaceType
    {
        FixedPrice,
        Auction,
        Rental,
        LootBox,
        Hybrid
    }
    
    [System.Serializable]
    public class Listing
    {
        public string listingId;
        public string nftId;
        public string sellerAddress;
        public ListingType listingType;
        public float price;
        public string currency;
        public DateTime startTime;
        public DateTime endTime;
        public bool isActive;
        public List<string> bidders = new List<string>();
        public float highestBid;
        public string highestBidder;
        public Dictionary<string, object> metadata = new Dictionary<string, object>();
    }
    
    public enum ListingType
    {
        FixedPrice,
        Auction,
        Rental,
        LootBox
    }
    
    [System.Serializable]
    public class StakingPool
    {
        public string poolId;
        public string name;
        public string description;
        public string nftContractAddress;
        public List<string> supportedNFTs = new List<string>();
        public float rewardRate;
        public string rewardToken;
        public int minStakeDuration;
        public int maxStakeDuration;
        public float totalStaked;
        public float totalRewards;
        public bool isActive;
        public DateTime created;
        public Dictionary<string, object> requirements = new Dictionary<string, object>();
    }
    
    [System.Serializable]
    public class StakingPosition
    {
        public string positionId;
        public string poolId;
        public string nftId;
        public string ownerAddress;
        public float amount;
        public DateTime stakedAt;
        public DateTime unlockTime;
        public float rewardsEarned;
        public float rewardsClaimed;
        public bool isActive;
        public Dictionary<string, object> metadata = new Dictionary<string, object>();
    }
    
    [System.Serializable]
    public class LootBox
    {
        public string lootBoxId;
        public string name;
        public string description;
        public LootBoxType lootBoxType;
        public float price;
        public string currency;
        public List<LootBoxItem> items = new List<LootBoxItem>();
        public int maxItems;
        public bool isGuaranteed;
        public bool isActive;
        public DateTime created;
        public DateTime expires;
        public Dictionary<string, object> metadata = new Dictionary<string, object>();
    }
    
    public enum LootBoxType
    {
        Common,
        Rare,
        Epic,
        Legendary,
        Special,
        Event,
        Seasonal
    }
    
    [System.Serializable]
    public class LootBoxItem
    {
        public string itemId;
        public string name;
        public string description;
        public ItemType itemType;
        public float dropRate;
        public int quantity;
        public Rarity rarity;
        public Dictionary<string, object> properties = new Dictionary<string, object>();
    }
    
    public enum ItemType
    {
        NFT,
        Token,
        Currency,
        Item,
        PowerUp,
        Skin,
        Accessory,
        Consumable
    }
    
    [System.Serializable]
    public class DAO
    {
        public string daoId;
        public string name;
        public string description;
        public string governanceToken;
        public List<string> members = new List<string>();
        public List<Proposal> proposals = new List<Proposal>();
        public Dictionary<string, float> votingPower = new Dictionary<string, float>();
        public bool isActive;
        public DateTime created;
        public Dictionary<string, object> settings = new Dictionary<string, object>();
    }
    
    [System.Serializable]
    public class Proposal
    {
        public string proposalId;
        public string title;
        public string description;
        public ProposalType proposalType;
        public string proposer;
        public List<string> options = new List<string>();
        public Dictionary<string, int> votes = new Dictionary<string, int>();
        public DateTime startTime;
        public DateTime endTime;
        public ProposalStatus status;
        public int quorum;
        public int totalVotes;
        public Dictionary<string, object> metadata = new Dictionary<string, object>();
    }
    
    public enum ProposalType
    {
        Governance,
        Treasury,
        Feature,
        Parameter,
        Emergency
    }
    
    public enum ProposalStatus
    {
        Draft,
        Active,
        Passed,
        Failed,
        Executed,
        Cancelled
    }
    
    public class BlockchainManager : MonoBehaviour
    {
        [Header("Blockchain Settings")]
        public bool enableBlockchain = true;
        public bool enableNFTs = true;
        public bool enableMarketplace = true;
        public bool enableStaking = true;
        public bool enableLootBoxes = true;
        public bool enableDAO = true;
        public bool enablePlayToEarn = true;
        
        [Header("Network Settings")]
        public string networkName = "Ethereum";
        public string rpcUrl = "https://mainnet.infura.io/v3/YOUR_PROJECT_ID";
        public int chainId = 1;
        public string nativeCurrency = "ETH";
        public float gasPrice = 20f; // Gwei
        public float gasLimit = 21000f;
        
        [Header("Contract Settings")]
        public string nftContractAddress = "";
        public string marketplaceContractAddress = "";
        public string stakingContractAddress = "";
        public string daoContractAddress = "";
        public string lootBoxContractAddress = "";
        
        [Header("Play-to-Earn Settings")]
        public float baseRewardRate = 1.0f;
        public float multiplierRate = 1.5f;
        public int minPlayTime = 300; // 5 minutes
        public int maxDailyRewards = 1000;
        public string rewardToken = "EVERGREEN";
        
        public static BlockchainManager Instance { get; private set; }
        
        private Dictionary<string, Wallet> wallets = new Dictionary<string, Wallet>();
        private Dictionary<string, NFT> nfts = new Dictionary<string, NFT>();
        private Dictionary<string, SmartContract> contracts = new Dictionary<string, SmartContract>();
        private Dictionary<string, Marketplace> marketplaces = new Dictionary<string, Marketplace>();
        private Dictionary<string, Listing> listings = new Dictionary<string, Listing>();
        private Dictionary<string, StakingPool> stakingPools = new Dictionary<string, StakingPool>();
        private Dictionary<string, StakingPosition> stakingPositions = new Dictionary<string, StakingPosition>();
        private Dictionary<string, LootBox> lootBoxes = new Dictionary<string, LootBox>();
        private Dictionary<string, DAO> daos = new Dictionary<string, DAO>();
        private Dictionary<string, Transaction> transactions = new Dictionary<string, Transaction>();
        
        private Web3Provider web3Provider;
        private NFTManager nftManager;
        private MarketplaceManager marketplaceManager;
        private StakingManager stakingManager;
        private LootBoxManager lootBoxManager;
        private DAOManager daoManager;
        private PlayToEarnManager playToEarnManager;
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeBlockchain();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            InitializeComponents();
            LoadBlockchainData();
        }
        
        private void InitializeBlockchain()
        {
            // Initialize Web3 provider
            web3Provider = gameObject.AddComponent<Web3Provider>();
            
            // Initialize managers
            nftManager = gameObject.AddComponent<NFTManager>();
            marketplaceManager = gameObject.AddComponent<MarketplaceManager>();
            stakingManager = gameObject.AddComponent<StakingManager>();
            lootBoxManager = gameObject.AddComponent<LootBoxManager>();
            daoManager = gameObject.AddComponent<DAOManager>();
            playToEarnManager = gameObject.AddComponent<PlayToEarnManager>();
        }
        
        private void InitializeComponents()
        {
            if (web3Provider != null)
            {
                web3Provider.Initialize(networkName, rpcUrl, chainId, nativeCurrency);
            }
            
            if (nftManager != null)
            {
                nftManager.Initialize(nftContractAddress);
            }
            
            if (marketplaceManager != null)
            {
                marketplaceManager.Initialize(marketplaceContractAddress);
            }
            
            if (stakingManager != null)
            {
                stakingManager.Initialize(stakingContractAddress);
            }
            
            if (lootBoxManager != null)
            {
                lootBoxManager.Initialize(lootBoxContractAddress);
            }
            
            if (daoManager != null)
            {
                daoManager.Initialize(daoContractAddress);
            }
            
            if (playToEarnManager != null)
            {
                playToEarnManager.Initialize(baseRewardRate, multiplierRate, minPlayTime, maxDailyRewards, rewardToken);
            }
        }
        
        private void LoadBlockchainData()
        {
            // Load blockchain data from save system
        }
        
        // Wallet Management
        public async Task<Wallet> ConnectWallet(WalletType walletType, string privateKey = null)
        {
            if (!enableBlockchain) return null;
            
            var wallet = new Wallet
            {
                address = "",
                privateKey = privateKey,
                walletType = walletType,
                isConnected = false,
                lastUsed = DateTime.Now
            };
            
            if (web3Provider != null)
            {
                var connectionResult = await web3Provider.ConnectWallet(walletType, privateKey);
                if (connectionResult.success)
                {
                    wallet.address = connectionResult.address;
                    wallet.publicKey = connectionResult.publicKey;
                    wallet.isConnected = true;
                    wallets[wallet.address] = wallet;
                }
            }
            
            return wallet;
        }
        
        public bool DisconnectWallet(string address)
        {
            if (wallets.ContainsKey(address))
            {
                wallets[address].isConnected = false;
                return true;
            }
            return false;
        }
        
        public Wallet GetWallet(string address)
        {
            return wallets.ContainsKey(address) ? wallets[address] : null;
        }
        
        public List<Wallet> GetConnectedWallets()
        {
            return wallets.Values.Where(w => w.isConnected).ToList();
        }
        
        // NFT Management
        public async Task<NFT> MintNFT(string ownerAddress, string name, string description, NFTType nftType, Rarity rarity, List<NFTAttribute> attributes = null)
        {
            if (!enableNFTs || nftManager == null) return null;
            
            var nft = new NFT
            {
                tokenId = Guid.NewGuid().ToString(),
                contractAddress = nftContractAddress,
                ownerAddress = ownerAddress,
                name = name,
                description = description,
                nftType = nftType,
                rarity = rarity,
                level = 1,
                experience = 0,
                isStaked = false,
                mintedAt = DateTime.Now,
                lastTransferred = DateTime.Now,
                value = GetRarityValue(rarity),
                currency = "ETH"
            };
            
            if (attributes != null)
            {
                nft.attributes = attributes;
            }
            
            // Mint on blockchain
            if (web3Provider != null)
            {
                var mintResult = await nftManager.MintNFT(nft);
                if (mintResult.success)
                {
                    nft.tokenId = mintResult.tokenId;
                    nfts[nft.tokenId] = nft;
                    
                    // Update wallet
                    if (wallets.ContainsKey(ownerAddress))
                    {
                        wallets[ownerAddress].nfts.Add(nft.tokenId);
                    }
                }
            }
            
            return nft;
        }
        
        public NFT GetNFT(string tokenId)
        {
            return nfts.ContainsKey(tokenId) ? nfts[tokenId] : null;
        }
        
        public List<NFT> GetNFTsByOwner(string ownerAddress)
        {
            return nfts.Values.Where(n => n.ownerAddress == ownerAddress).ToList();
        }
        
        public List<NFT> GetNFTsByType(NFTType nftType)
        {
            return nfts.Values.Where(n => n.nftType == nftType).ToList();
        }
        
        public List<NFT> GetNFTsByRarity(Rarity rarity)
        {
            return nfts.Values.Where(n => n.rarity == rarity).ToList();
        }
        
        public async Task<bool> TransferNFT(string tokenId, string fromAddress, string toAddress)
        {
            if (!enableNFTs || nftManager == null) return false;
            
            var nft = GetNFT(tokenId);
            if (nft == null || nft.ownerAddress != fromAddress) return false;
            
            // Transfer on blockchain
            if (web3Provider != null)
            {
                var transferResult = await nftManager.TransferNFT(tokenId, fromAddress, toAddress);
                if (transferResult.success)
                {
                    // Update local data
                    nft.ownerAddress = toAddress;
                    nft.lastTransferred = DateTime.Now;
                    
                    // Update wallets
                    if (wallets.ContainsKey(fromAddress))
                    {
                        wallets[fromAddress].nfts.Remove(tokenId);
                    }
                    if (wallets.ContainsKey(toAddress))
                    {
                        wallets[toAddress].nfts.Add(tokenId);
                    }
                    
                    return true;
                }
            }
            
            return false;
        }
        
        // Marketplace Management
        public async Task<Listing> CreateListing(string nftId, string sellerAddress, ListingType listingType, float price, string currency, DateTime endTime)
        {
            if (!enableMarketplace || marketplaceManager == null) return null;
            
            var listing = new Listing
            {
                listingId = Guid.NewGuid().ToString(),
                nftId = nftId,
                sellerAddress = sellerAddress,
                listingType = listingType,
                price = price,
                currency = currency,
                startTime = DateTime.Now,
                endTime = endTime,
                isActive = true
            };
            
            // Create listing on blockchain
            if (web3Provider != null)
            {
                var createResult = await marketplaceManager.CreateListing(listing);
                if (createResult.success)
                {
                    listings[listing.listingId] = listing;
                }
            }
            
            return listing;
        }
        
        public Listing GetListing(string listingId)
        {
            return listings.ContainsKey(listingId) ? listings[listingId] : null;
        }
        
        public List<Listing> GetActiveListings()
        {
            return listings.Values.Where(l => l.isActive && l.endTime > DateTime.Now).ToList();
        }
        
        public List<Listing> GetListingsBySeller(string sellerAddress)
        {
            return listings.Values.Where(l => l.sellerAddress == sellerAddress).ToList();
        }
        
        public async Task<bool> BuyNFT(string listingId, string buyerAddress, float price)
        {
            if (!enableMarketplace || marketplaceManager == null) return false;
            
            var listing = GetListing(listingId);
            if (listing == null || !listing.isActive) return false;
            if (listing.price != price) return false;
            
            // Buy on blockchain
            if (web3Provider != null)
            {
                var buyResult = await marketplaceManager.BuyNFT(listingId, buyerAddress, price);
                if (buyResult.success)
                {
                    // Update listing
                    listing.isActive = false;
                    
                    // Transfer NFT
                    var nft = GetNFT(listing.nftId);
                    if (nft != null)
                    {
                        await TransferNFT(listing.nftId, listing.sellerAddress, buyerAddress);
                    }
                    
                    return true;
                }
            }
            
            return false;
        }
        
        public async Task<bool> PlaceBid(string listingId, string bidderAddress, float bidAmount)
        {
            if (!enableMarketplace || marketplaceManager == null) return false;
            
            var listing = GetListing(listingId);
            if (listing == null || !listing.isActive) return false;
            if (listing.listingType != ListingType.Auction) return false;
            if (bidAmount <= listing.highestBid) return false;
            
            // Place bid on blockchain
            if (web3Provider != null)
            {
                var bidResult = await marketplaceManager.PlaceBid(listingId, bidderAddress, bidAmount);
                if (bidResult.success)
                {
                    // Update listing
                    listing.highestBid = bidAmount;
                    listing.highestBidder = bidderAddress;
                    if (!listing.bidders.Contains(bidderAddress))
                    {
                        listing.bidders.Add(bidderAddress);
                    }
                    
                    return true;
                }
            }
            
            return false;
        }
        
        // Staking Management
        public async Task<StakingPosition> StakeNFT(string nftId, string poolId, string ownerAddress, int duration)
        {
            if (!enableStaking || stakingManager == null) return null;
            
            var nft = GetNFT(nftId);
            if (nft == null || nft.ownerAddress != ownerAddress) return null;
            
            var position = new StakingPosition
            {
                positionId = Guid.NewGuid().ToString(),
                poolId = poolId,
                nftId = nftId,
                ownerAddress = ownerAddress,
                amount = 1,
                stakedAt = DateTime.Now,
                unlockTime = DateTime.Now.AddDays(duration),
                rewardsEarned = 0f,
                rewardsClaimed = 0f,
                isActive = true
            };
            
            // Stake on blockchain
            if (web3Provider != null)
            {
                var stakeResult = await stakingManager.StakeNFT(position);
                if (stakeResult.success)
                {
                    stakingPositions[position.positionId] = position;
                    nft.isStaked = true;
                    
                    return position;
                }
            }
            
            return null;
        }
        
        public async Task<bool> UnstakeNFT(string positionId, string ownerAddress)
        {
            if (!enableStaking || stakingManager == null) return false;
            
            var position = stakingPositions.ContainsKey(positionId) ? stakingPositions[positionId] : null;
            if (position == null || position.ownerAddress != ownerAddress) return false;
            if (position.unlockTime > DateTime.Now) return false;
            
            // Unstake on blockchain
            if (web3Provider != null)
            {
                var unstakeResult = await stakingManager.UnstakeNFT(positionId, ownerAddress);
                if (unstakeResult.success)
                {
                    // Update position
                    position.isActive = false;
                    
                    // Update NFT
                    var nft = GetNFT(position.nftId);
                    if (nft != null)
                    {
                        nft.isStaked = false;
                    }
                    
                    return true;
                }
            }
            
            return false;
        }
        
        public async Task<float> ClaimRewards(string positionId, string ownerAddress)
        {
            if (!enableStaking || stakingManager == null) return 0f;
            
            var position = stakingPositions.ContainsKey(positionId) ? stakingPositions[positionId] : null;
            if (position == null || position.ownerAddress != ownerAddress) return 0f;
            
            // Calculate rewards
            var rewards = CalculateStakingRewards(position);
            
            // Claim on blockchain
            if (web3Provider != null)
            {
                var claimResult = await stakingManager.ClaimRewards(positionId, ownerAddress, rewards);
                if (claimResult.success)
                {
                    position.rewardsClaimed += rewards;
                    position.rewardsEarned = 0f;
                    
                    return rewards;
                }
            }
            
            return 0f;
        }
        
        private float CalculateStakingRewards(StakingPosition position)
        {
            var pool = stakingPools.ContainsKey(position.poolId) ? stakingPools[position.poolId] : null;
            if (pool == null) return 0f;
            
            var stakingDuration = (float)(DateTime.Now - position.stakedAt).TotalDays;
            var rewards = position.amount * pool.rewardRate * stakingDuration;
            
            return rewards;
        }
        
        // Loot Box Management
        public async Task<LootBox> CreateLootBox(string name, string description, LootBoxType lootBoxType, float price, string currency, List<LootBoxItem> items)
        {
            if (!enableLootBoxes || lootBoxManager == null) return null;
            
            var lootBox = new LootBox
            {
                lootBoxId = Guid.NewGuid().ToString(),
                name = name,
                description = description,
                lootBoxType = lootBoxType,
                price = price,
                currency = currency,
                items = items,
                maxItems = 1,
                isGuaranteed = false,
                isActive = true,
                created = DateTime.Now,
                expires = DateTime.Now.AddDays(30)
            };
            
            // Create on blockchain
            if (web3Provider != null)
            {
                var createResult = await lootBoxManager.CreateLootBox(lootBox);
                if (createResult.success)
                {
                    lootBoxes[lootBox.lootBoxId] = lootBox;
                }
            }
            
            return lootBox;
        }
        
        public async Task<List<LootBoxItem>> OpenLootBox(string lootBoxId, string ownerAddress)
        {
            if (!enableLootBoxes || lootBoxManager == null) return new List<LootBoxItem>();
            
            var lootBox = lootBoxes.ContainsKey(lootBoxId) ? lootBoxes[lootBoxId] : null;
            if (lootBox == null || !lootBox.isActive) return new List<LootBoxItem>();
            
            // Open on blockchain
            if (web3Provider != null)
            {
                var openResult = await lootBoxManager.OpenLootBox(lootBoxId, ownerAddress);
                if (openResult.success)
                {
                    return openResult.items;
                }
            }
            
            return new List<LootBoxItem>();
        }
        
        // DAO Management
        public async Task<DAO> CreateDAO(string name, string description, string governanceToken)
        {
            if (!enableDAO || daoManager == null) return null;
            
            var dao = new DAO
            {
                daoId = Guid.NewGuid().ToString(),
                name = name,
                description = description,
                governanceToken = governanceToken,
                isActive = true,
                created = DateTime.Now
            };
            
            // Create on blockchain
            if (web3Provider != null)
            {
                var createResult = await daoManager.CreateDAO(dao);
                if (createResult.success)
                {
                    daos[dao.daoId] = dao;
                }
            }
            
            return dao;
        }
        
        public async Task<Proposal> CreateProposal(string daoId, string title, string description, ProposalType proposalType, string proposer, List<string> options)
        {
            if (!enableDAO || daoManager == null) return null;
            
            var proposal = new Proposal
            {
                proposalId = Guid.NewGuid().ToString(),
                title = title,
                description = description,
                proposalType = proposalType,
                proposer = proposer,
                options = options,
                startTime = DateTime.Now,
                endTime = DateTime.Now.AddDays(7),
                status = ProposalStatus.Active,
                quorum = 10,
                totalVotes = 0
            };
            
            // Create on blockchain
            if (web3Provider != null)
            {
                var createResult = await daoManager.CreateProposal(daoId, proposal);
                if (createResult.success)
                {
                    var dao = daos.ContainsKey(daoId) ? daos[daoId] : null;
                    if (dao != null)
                    {
                        dao.proposals.Add(proposal);
                    }
                }
            }
            
            return proposal;
        }
        
        public async Task<bool> VoteOnProposal(string proposalId, string voterAddress, int optionIndex)
        {
            if (!enableDAO || daoManager == null) return false;
            
            // Vote on blockchain
            if (web3Provider != null)
            {
                var voteResult = await daoManager.VoteOnProposal(proposalId, voterAddress, optionIndex);
                if (voteResult.success)
                {
                    // Update local data
                    var proposal = FindProposal(proposalId);
                    if (proposal != null)
                    {
                        var option = proposal.options[optionIndex];
                        if (proposal.votes.ContainsKey(option))
                        {
                            proposal.votes[option]++;
                        }
                        else
                        {
                            proposal.votes[option] = 1;
                        }
                        proposal.totalVotes++;
                    }
                    
                    return true;
                }
            }
            
            return false;
        }
        
        private Proposal FindProposal(string proposalId)
        {
            foreach (var dao in daos.Values)
            {
                var proposal = dao.proposals.FirstOrDefault(p => p.proposalId == proposalId);
                if (proposal != null) return proposal;
            }
            return null;
        }
        
        // Play-to-Earn Management
        public async Task<float> EarnRewards(string playerAddress, int playTime, float multiplier = 1f)
        {
            if (!enablePlayToEarn || playToEarnManager == null) return 0f;
            
            if (playTime < minPlayTime) return 0f;
            
            var rewards = playToEarnManager.CalculateRewards(playTime, multiplier);
            
            // Mint rewards on blockchain
            if (web3Provider != null)
            {
                var mintResult = await playToEarnManager.MintRewards(playerAddress, rewards);
                if (mintResult.success)
                {
                    return rewards;
                }
            }
            
            return 0f;
        }
        
        // Utility Methods
        private float GetRarityValue(Rarity rarity)
        {
            switch (rarity)
            {
                case Rarity.Common: return 0.01f;
                case Rarity.Uncommon: return 0.05f;
                case Rarity.Rare: return 0.1f;
                case Rarity.Epic: return 0.5f;
                case Rarity.Legendary: return 1f;
                case Rarity.Mythic: return 5f;
                case Rarity.Unique: return 10f;
                default: return 0.01f;
            }
        }
        
        public Dictionary<string, object> GetBlockchainAnalytics()
        {
            return new Dictionary<string, object>
            {
                {"blockchain_enabled", enableBlockchain},
                {"nfts_enabled", enableNFTs},
                {"marketplace_enabled", enableMarketplace},
                {"staking_enabled", enableStaking},
                {"loot_boxes_enabled", enableLootBoxes},
                {"dao_enabled", enableDAO},
                {"play_to_earn_enabled", enablePlayToEarn},
                {"total_wallets", wallets.Count},
                {"connected_wallets", wallets.Count(w => w.Value.isConnected)},
                {"total_nfts", nfts.Count},
                {"total_listings", listings.Count},
                {"active_listings", listings.Count(l => l.Value.isActive)},
                {"total_staking_positions", stakingPositions.Count},
                {"active_staking_positions", stakingPositions.Count(s => s.Value.isActive)},
                {"total_loot_boxes", lootBoxes.Count},
                {"active_loot_boxes", lootBoxes.Count(l => l.Value.isActive)},
                {"total_daos", daos.Count},
                {"active_daos", daos.Count(d => d.Value.isActive)}
            };
        }
    }
    
    // Supporting classes
    public class Web3Provider : MonoBehaviour
    {
        public void Initialize(string networkName, string rpcUrl, int chainId, string nativeCurrency) { }
        public async Task<(bool success, string address, string publicKey)> ConnectWallet(WalletType walletType, string privateKey) { return (true, "", ""); }
    }
    
    public class NFTManager : MonoBehaviour
    {
        public void Initialize(string contractAddress) { }
        public async Task<(bool success, string tokenId)> MintNFT(NFT nft) { return (true, ""); }
        public async Task<(bool success, string transactionHash)> TransferNFT(string tokenId, string fromAddress, string toAddress) { return (true, ""); }
    }
    
    public class MarketplaceManager : MonoBehaviour
    {
        public void Initialize(string contractAddress) { }
        public async Task<(bool success, string listingId)> CreateListing(Listing listing) { return (true, ""); }
        public async Task<(bool success, string transactionHash)> BuyNFT(string listingId, string buyerAddress, float price) { return (true, ""); }
        public async Task<(bool success, string transactionHash)> PlaceBid(string listingId, string bidderAddress, float bidAmount) { return (true, ""); }
    }
    
    public class StakingManager : MonoBehaviour
    {
        public void Initialize(string contractAddress) { }
        public async Task<(bool success, string positionId)> StakeNFT(StakingPosition position) { return (true, ""); }
        public async Task<(bool success, string transactionHash)> UnstakeNFT(string positionId, string ownerAddress) { return (true, ""); }
        public async Task<(bool success, string transactionHash)> ClaimRewards(string positionId, string ownerAddress, float amount) { return (true, ""); }
    }
    
    public class LootBoxManager : MonoBehaviour
    {
        public void Initialize(string contractAddress) { }
        public async Task<(bool success, string lootBoxId)> CreateLootBox(LootBox lootBox) { return (true, ""); }
        public async Task<(bool success, List<LootBoxItem> items)> OpenLootBox(string lootBoxId, string ownerAddress) { return (true, new List<LootBoxItem>()); }
    }
    
    public class DAOManager : MonoBehaviour
    {
        public void Initialize(string contractAddress) { }
        public async Task<(bool success, string daoId)> CreateDAO(DAO dao) { return (true, ""); }
        public async Task<(bool success, string proposalId)> CreateProposal(string daoId, Proposal proposal) { return (true, ""); }
        public async Task<(bool success, string transactionHash)> VoteOnProposal(string proposalId, string voterAddress, int optionIndex) { return (true, ""); }
    }
    
    public class PlayToEarnManager : MonoBehaviour
    {
        public void Initialize(float baseRewardRate, float multiplierRate, int minPlayTime, int maxDailyRewards, string rewardToken) { }
        public float CalculateRewards(int playTime, float multiplier) { return 0f; }
        public async Task<(bool success, string transactionHash)> MintRewards(string playerAddress, float amount) { return (true, ""); }
    }
}