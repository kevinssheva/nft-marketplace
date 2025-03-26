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

  return {
    listings,
    isLoading,
    error,
    fetchListings,
    buyNFT,
  };
}
