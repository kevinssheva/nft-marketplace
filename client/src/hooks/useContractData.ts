import { useWallet } from '@/context/WalletContext';
import {
  ContractService,
  createContractService,
} from '@/services/ContractService';
import { useCallback, useEffect, useState } from 'react';

export function useContractData() {
  const { provider, signer, isConnected } = useWallet();
  const [contractService, setContractService] =
    useState<ContractService | null>(null);
  const [listings, setListings] = useState<NFTDataType[]>([]);
  const [ownedNFTs, setOwnedNFTs] = useState<NFTDataType[]>([]);
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
    async (
      metadataUri: string, 
      mintFee: string, 
      salesRoyaltyPercentage: number, 
      ownerListenPercentage: number
    ) => {
      if (!contractService) {
        setError('Wallet not connected');
        return { success: false };
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await contractService.mintNFT(
          metadataUri, 
          mintFee, 
          salesRoyaltyPercentage, 
          ownerListenPercentage
        );
        
        // Refresh listings after minting
        await fetchListings();

        return {
          success: true,
          tokenId: result.tokenId,
          txHash: result.txHash,
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

  const fetchMyNFTs = useCallback(async () => {
    if (!contractService) {
      setError('Wallet not connected');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await contractService.getMyNFTs();
      setOwnedNFTs(data);
    } catch (err) {
      console.error('Error fetching owned NFTs', err);
      setError('Error fetching owned NFTs');
    } finally {
      setIsLoading(false);
    }
  }, [contractService]);

  const listNFT = useCallback(
    async (tokenId: string, price: string) => {
      if (!contractService) {
        setError('Wallet not connected');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        await contractService.listNFT(tokenId, price);
        await fetchMyNFTs();
        await fetchListings();
      } catch (err) {
        console.error('Error listing NFT', err);
        setError('Failed to list NFT');
      } finally {
        setIsLoading(false);
      }
    },
    [contractService, fetchListings, fetchMyNFTs]
  );

  return {
    listings,
    ownedNFTs,
    isLoading,
    error,
    fetchListings,
    fetchMyNFTs,
    listNFT,
    buyNFT,
    mintNFT,
  };
}
