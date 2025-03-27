import { ethers } from 'ethers';
import NFTMarketplaceABI from '../abi/NFTMarketplace.json';

const NFT_MARKETPLACE_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

export class ContractService {
  private contract: ethers.Contract | null = null;
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;

  constructor(
    provider?: ethers.BrowserProvider,
    signer?: ethers.JsonRpcSigner
  ) {
    if (provider) this.setProvider(provider);
    if (signer) this.setSigner(signer);
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

    // console.log('Fetching listings', skip, take);
    // console.log('Using contract at:', NFT_MARKETPLACE_ADDRESS);

    try {
      // console.log('Calling getAllListings with:', skip, take);
      const [tokenIds, sellers, prices] = await this.contract.getAllListings(
        skip,
        take
      );

      // console.log('Got listings result:', tokenIds);

      const listings = await Promise.all(
        tokenIds.map(async (tokenId: bigint, index: number) => {
          const tokenURI = await this.contract!.tokenURI(tokenId);
          let metadata = { name: `NFT #${tokenId.toString()}`, image: '' };

          try {
            if (tokenURI.startsWith('ipfs://')) {
              const ipfsHash = tokenURI.replace('ipfs://', '');
              const response = await fetch(`https://ipfs.io/ipfs/${ipfsHash}`);
              metadata = await response.json();
            } else {
              const response = await fetch(tokenURI);
              metadata = await response.json();
            }
          } catch (error) {
            console.error(
              `Failed to fetch metadata for token #${tokenId}`,
              error
            );
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
    mintFeeEth: string
  ): Promise<{ tokenId: string; txHash: string }> {
    if (!this.contract || !this.signer)
      throw new Error('Contract or signer not initialized');

    const mintFeeWei = ethers.parseEther(mintFeeEth);

    const tx = await this.contract.mint(metadata, {
      value: mintFeeWei,
    });

    const receipt = await tx.wait();

    const mintEvent = receipt.events?.find(
      (event: { event: string }) => event.event === 'NFTMinted'
    );

    const tokenId = mintEvent ? mintEvent.args?.tokenId.toString() : '0';

    return { tokenId, txHash: receipt.transactionHash };
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
