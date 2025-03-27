import { useWallet } from '@/context/WalletContext';
import {
  ContractService,
  createContractService,
} from '@/services/ContractService';
import { useCallback, useEffect, useState } from 'react';

// First, let's define the ListingData type that's missing
export interface ListingData {
  id: string;
  name: string;
  image: string;
  price: string;
  creator: string;
  isOwned: boolean;
  isListed: boolean;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
}

export function useContractData() {
  const { provider, signer, isConnected } = useWallet();
  const [contractService, setContractService] =
    useState<ContractService | null>(null);
  const [listings, setListings] = useState<ListingData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (provider && isConnected) {
      const service = createContractService(provider, signer || undefined);
      setContractService(service);
    } else {
      setContractService(null);
    }
  }, [provider, signer, isConnected]);

  // Use useCallback to memoize the function reference
  const fetchListings = useCallback(
    async (skip = 0, take = 10) => {
      if (!contractService) {
        setError('Wallet not connected');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await contractService.getAllListings(skip, take);
        setListings(data);
      } catch (err) {
        console.error('Error fetching listings', err);
        setError('Error fetching listings');
      } finally {
        setIsLoading(false);
      }
    },
    [contractService]
  );

  const buyNFT = useCallback(
    async (tokenId: string, price: string) => {
      if (!contractService) {
        setError('Wallet not connected');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        await contractService.buyNFT(tokenId, price);
        await fetchListings();
        return true;
      } catch (err) {
        console.error('Error buying NFT', err);
        setError('Failed to buy NFT');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [contractService, fetchListings]
  );

  const mintNFT = useCallback(
    async (metadata: NFTMetadata, mintFee: string) => {
      if (!contractService) {
        setError('Wallet not connected');
        return { success: false };
      }

      setIsLoading(true);
      setError(null);

      try {
        // In a real app, you would upload to IPFS or another storage service first
        // For simplicity, we're assuming the metadata.image is already an IPFS URI or similar
        
        // Create a JSON metadata URI
        const metadataUri = JSON.stringify({
          name: metadata.name,
          description: metadata.description,
          image: metadata.image,
        });
        
        // Call the mint function on the contract
        const result = await contractService.mintNFT(metadataUri, mintFee);
        
        // Refresh listings after minting
        await fetchListings();
        
        return {
          success: true,
          tokenId: result.tokenId,
          txHash: result.txHash
        };
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error('Error minting NFT', err);
          setError(err.message || 'Failed to mint NFT');
        } else {
          console.error('Unexpected error', err);
          setError('Failed to mint NFT');
        }
        return { success: false };
      } finally {
        setIsLoading(false);
      }
    },
    [contractService, fetchListings]
  );

  return {
    listings,
    isLoading,
    error,
    fetchListings,
    buyNFT,
    mintNFT,
  };
}