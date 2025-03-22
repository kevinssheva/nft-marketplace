import { useWallet } from '@/context/WalletContext';
import {
  ContractService,
  createContractService,
} from '@/services/ContractService';
import { useEffect, useState } from 'react';

export function useContractData() {
  const { provider, signer, isConnected } = useWallet();
  const [contractService, setContractService] =
    useState<ContractService | null>(null);
  const [listings, setListings] = useState<ListingData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // useEffect(() => {
  //   console.log('Wallet connection state:', {
  //     isConnected,
  //     hasProvider: !!provider,
  //     hasSigner: !!signer,
  //     hasContractService: !!contractService,
  //   });

  //   // Check if we're on the right network
  //   if (provider) {
  //     provider
  //       .getNetwork()
  //       .then((network) => {
  //         console.log('Connected to network:', network.name, network.chainId);
  //       })
  //       .catch((err) => {
  //         console.error('Failed to get network:', err);
  //       });
  //   }
  // }, [isConnected, provider, signer, contractService]);

  useEffect(() => {
    if (provider && isConnected) {
      const service = createContractService(provider, signer || undefined);
      setContractService(service);
    } else {
      setContractService(null);
    }
  }, [provider, signer, isConnected]);

  const fetchListings = async (skip = 0, take = 10) => {
    if (!contractService) {
      setError('Wallet not connected');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      contractService.testConnection();
      const data = await contractService.getAllListings(skip, take);
      setListings(data);
    } catch (err) {
      console.error('Error fetching listings', err);
      setError('Error fetching listings');
    } finally {
      setIsLoading(false);
    }
  };

  const buyNFT = async (tokenId: string, price: string) => {
    if (!contractService) {
      setError('Wallet not connected');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await contractService.buyNFT(tokenId, price);
      await fetchListings();
    } catch (err) {
      console.error('Error buying NFT', err);
      setError('Failed to buy NFT');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    listings,
    isLoading,
    error,
    fetchListings,
    buyNFT,
  };
}
