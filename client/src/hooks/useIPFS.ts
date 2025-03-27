import { IPFSService } from '@/services/IPFSService';
import { useEffect, useState } from 'react';
import { NFTMetadata } from './useContractData';

export function useIPFS() {
  const [ipfsService, setIpfsService] = useState<IPFSService | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const service = new IPFSService();
    setIpfsService(service);
  }, []);

  const uploadFile = async (file: File) => {
    if (!ipfsService) {
      setError('IPFS service not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const ipfsUri = await ipfsService.uploadFile(file);
      return ipfsUri;
    } catch (err) {
      console.error('Error uploading file', err);
      setError('Error uploading file');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadMetadata = async (metadata: NFTMetadata) => {
    if (!ipfsService) {
      setError('IPFS service not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const ipfsUri = await ipfsService.uploadMetadata(metadata);
      return ipfsUri;
    } catch (err) {
      console.error('Error uploading metadata', err);
      setError('Error uploading metadata');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getGatewayUrl = (ipfsUri: string) => {
    if (!ipfsService) {
      setError('IPFS service not initialized');
      return;
    }

    return ipfsService.getGatewayUrl(ipfsUri);
  };

  return {
    isLoading,
    error,
    uploadFile,
    uploadMetadata,
    getGatewayUrl,
  };
}
