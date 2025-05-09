import { ethers } from 'ethers';
import NFTMarketplaceABI from '../abi/NFTMarketplace.json';
import { IPFSService } from './IPFSService';

const NFT_MARKETPLACE_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

export class ContractService {
  private contract: ethers.Contract | null = null;
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private ipfsService: IPFSService;

  constructor(
    provider?: ethers.BrowserProvider,
    signer?: ethers.JsonRpcSigner
  ) {
    if (provider) this.setProvider(provider);
    if (signer) this.setSigner(signer);
    this.ipfsService = new IPFSService();
  }

  setProvider(provider: ethers.BrowserProvider) {
    this.provider = provider;
    this.contract = new ethers.Contract(
      NFT_MARKETPLACE_ADDRESS,
      NFTMarketplaceABI.abi,
      provider
    );
    console.log('Provider set, contract initialized');
  }

  setSigner(signer: ethers.JsonRpcSigner) {
    this.signer = signer;
    if (this.contract) {
      this.contract = this.contract.connect(signer) as ethers.Contract;
    } else if (this.provider) {
      this.contract = new ethers.Contract(
        NFT_MARKETPLACE_ADDRESS,
        NFTMarketplaceABI.abi,
        this.provider
      ).connect(signer) as ethers.Contract;
    }
  }

  async getAllListings(skip = 0, take = 10) {
    if (!this.contract) throw new Error('Contract not initialized');

    try {
      const [tokenIds, sellers, prices] = await this.contract.getAllListings(
        skip,
        take
      );

      const listings = await Promise.all(
        tokenIds.map(async (tokenId: bigint, index: number) => {
          const tokenURI = await this.contract!.tokenURI(tokenId);
          let metadata: NFTMetadataType = {
            name: `NFT #${tokenId.toString()}`,
            description: '',
            image: '',
          };

          try {
            // Use the IPFS service to get gateway URL for metadata
            const metadataUrl = this.ipfsService.getGatewayUrl(tokenURI);
            const response = await fetch(metadataUrl);
            metadata = await response.json();

            // Process image URL to use IPFS gateway if needed
            if (metadata.image && metadata.image.startsWith('ipfs://')) {
              metadata.image = this.ipfsService.getGatewayUrl(metadata.image);
            }
          } catch (error) {
            console.error(
              `Failed to fetch metadata for token #${tokenId}`,
              error
            );
          }

          // Check if the current user owns this NFT
          let isOwned = false;
          if (this.signer) {
            const signerAddress = await this.signer.getAddress();
            const tokenOwner = await this.contract!.ownerOf(tokenId);
            isOwned = tokenOwner.toLowerCase() === signerAddress.toLowerCase();
          }

          return {
            id: tokenId.toString(),
            name: metadata.name,
            image: metadata.image,
            price: ethers.formatEther(prices[index]),
            creator: {
              address: sellers[index],
              name: null,
            },
            isOwned,
            isListed: true,
          };
        })
      );

      return listings;
    } catch (error) {
      console.error('Failed to fetch listings', error);
      throw error;
    }
  }

  async buyNFT(tokenId: string, price: string) {
    if (!this.contract || !this.signer)
      throw new Error('Contract or signer not initialized');

    try {
      const priceInWei = ethers.parseEther(price);
      const tx = await this.contract.buyNFT(tokenId, {
        value: priceInWei,
      });
      return await tx.wait();
    } catch (error) {
      console.error('Failed to buy NFT', error);
      throw error;
    }
  }

  async mintNFT(
    metadata: string,
    mintFeeEth: string,
    salesRoyaltyPercentage: number,
    ownerListenPercentage: number
  ): Promise<{ tokenId: string; txHash: string }> {
    if (!this.contract || !this.signer)
      throw new Error('Contract or signer not initialized');

    const mintFeeWei = ethers.parseEther(mintFeeEth);

    const tx = await this.contract.mint(
      metadata,
      salesRoyaltyPercentage,
      ownerListenPercentage,
      {
        value: mintFeeWei,
      }
    );

    const receipt = await tx.wait();

    const mintEvent = receipt.events?.find(
      (event: { event: string }) => event.event === 'NFTMinted'
    );

    const tokenId = mintEvent ? mintEvent.args?.tokenId.toString() : '0';

    return { tokenId, txHash: receipt.transactionHash };
  }

  async getMyNFTs() {
    if (!this.contract || !this.signer)
      throw new Error('Contract or signer not initialized');

    try {
      // Call contract's getMyNFTs function which returns [tokenIds, isListed]
      const [tokenIds, isListedArray] = await this.contract.getMyNFTs();

      const nfts = await Promise.all(
        tokenIds.map(async (tokenId: bigint, index: number) => {
          // Get token URI and metadata
          const tokenURI = await this.contract!.tokenURI(tokenId);
          let metadata: NFTMetadataType = {
            name: `NFT #${tokenId.toString()}`,
            description: '',
            image: '',
          };

          // Get if the token is listed and its price if it is
          const isListed = isListedArray[index];
          let price = '0';
          let seller = '';

          // Only fetch price if the NFT is listed
          if (isListed) {
            try {
              // For active listings, we need to query the listings mapping
              // through the active listings array
              const [activeSellers, activePrices] =
                await this.contract!.getListingsBySeller(
                  await this.signer!.getAddress()
                );

              // Find this token's price in the active listings
              const listingIndex = activeSellers.findIndex(
                (id: bigint) => id.toString() === tokenId.toString()
              );

              if (listingIndex >= 0) {
                price = ethers.formatEther(activePrices[listingIndex]);
                seller = await this.signer!.getAddress();
              }
            } catch (err) {
              console.error(
                `Error fetching listing for token #${tokenId}`,
                err
              );
            }
          }

          // Fetch and parse metadata
          try {
            const metadataUrl = this.ipfsService.getGatewayUrl(tokenURI);
            const response = await fetch(metadataUrl);
            metadata = await response.json();

            if (metadata.image && metadata.image.startsWith('ipfs://')) {
              metadata.image = this.ipfsService.getGatewayUrl(metadata.image);
            }
          } catch (error) {
            console.error(
              `Failed to fetch metadata for token #${tokenId}`,
              error
            );
          }

          // Return formatted NFT object
          return {
            id: tokenId.toString(),
            name: metadata.name,
            description: metadata.description,
            image: metadata.image,
            price: price,
            creator: {
              address: seller || (await this.signer!.getAddress()),
              name: null,
            },
            isOwned: true, // These are definitely owned by the user
            isListed: isListed,
          };
        })
      );

      return nfts;
    } catch (error) {
      console.error('Failed to fetch NFTs', error);
      throw error;
    }
  }

  async listNFT(tokenId: string, price: string) {
    if (!this.contract || !this.signer) {
      throw new Error('Contract or signer not initialized');
    }

    try {
      const priceInWei = ethers.parseEther(price);
      const tx = await this.contract.listNFT(tokenId, priceInWei);
      return await tx.wait();
    } catch (error) {
      console.error('Failed to list NFT', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      console.log('Testing connection to contract...');
      const name = await this.contract!.name();
      console.log('Contract name:', name);
      return true;
    } catch (err) {
      console.error('Connection test failed:', err);
      return false;
    }
  }
}

export const createContractService = (
  provider?: ethers.BrowserProvider,
  signer?: ethers.JsonRpcSigner
) => {
  return new ContractService(provider, signer);
};
