'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { ethers } from 'ethers';

// Types
type WalletAddress = string | null;
type ChainId = number | null;
type Provider = ethers.BrowserProvider | null;
type Signer = ethers.JsonRpcSigner | null;

interface WalletContextType {
  address: WalletAddress;
  chainId: ChainId;
  provider: Provider;
  signer: Signer;
  balance: string;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

// Context
export const WalletContext = createContext<WalletContextType>({
  address: null,
  chainId: null,
  provider: null,
  signer: null,
  balance: '0',
  isConnected: false,
  isConnecting: false,
  error: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
});

// Provider Component
export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [address, setAddress] = useState<WalletAddress>(null);
  const [chainId, setChainId] = useState<ChainId>(null);
  const [provider, setProvider] = useState<Provider>(null);
  const [signer, setSigner] = useState<Signer>(null);
  const [balance, setBalance] = useState<string>('0');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize wallet from localStorage on load
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const savedAddress = localStorage.getItem('walletAddress');
        if (savedAddress && window.ethereum) {
          await connectWallet();
        }
      } catch (err) {
        console.error('Failed to reconnect wallet:', err);
      }
    };

    checkConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update balance whenever address or chainId changes
  useEffect(() => {
    const updateBalance = async () => {
      if (provider && address) {
        try {
          const balance = await provider.getBalance(address);
          setBalance(ethers.formatEther(balance));
        } catch (err) {
          console.error('Failed to fetch balance:', err);
        }
      }
    };

    updateBalance();
  }, [provider, address, chainId]);

  // Listen for account and network changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (accounts[0] !== address) {
          setAddress(accounts[0]);
          localStorage.setItem('walletAddress', accounts[0]);
        }
      };

      const handleChainChanged = (chainIdHex: string) => {
        const newChainId = parseInt(chainIdHex, 16);
        setChainId(newChainId);
        // Refresh provider and signer on chain change
        setupProviderAndSigner();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener(
            'accountsChanged',
            handleAccountsChanged
          );
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [address]);

  const setupProviderAndSigner = async () => {
    if (!window.ethereum) {
      setError('Please install MetaMask to connect');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(provider);

      const signer = await provider.getSigner();
      setSigner(signer);

      const network = await provider.getNetwork();
      setChainId(Number(network.chainId));

      return { provider, signer };
    } catch (err) {
      console.error('Failed to setup provider:', err);
      setError('Failed to setup wallet connection');
      return null;
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('Please install MetaMask to connect');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const connection = await setupProviderAndSigner();
      if (!connection) return;

      setAddress(accounts[0]);
      localStorage.setItem('walletAddress', accounts[0]);
    } catch (err: unknown) {
      console.error('Error connecting wallet:', err);
      setError((err as Error)?.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
    setBalance('0');
    localStorage.removeItem('walletAddress');
  };

  return (
    <WalletContext.Provider
      value={{
        address: address,
        chainId: chainId,
        provider: provider,
        signer: signer,
        balance: balance,
        isConnected: !!address,
        isConnecting: isConnecting,
        error: error,
        connectWallet: connectWallet,
        disconnectWallet: disconnectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

// Custom hook
export const useWallet = () => useContext(WalletContext);
