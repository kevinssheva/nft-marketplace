'use client';

import { useWallet } from '@/context/WalletContext';

export default function ConnectWalletButton() {
  const {
    address,
    isConnected,
    isConnecting,
    connectWallet,
    disconnectWallet,
  } = useWallet();

  return (
    <button
      onClick={isConnected ? disconnectWallet : connectWallet}
      disabled={isConnecting}
      className="bg-primary hover:bg-primary-hover text-text py-2 px-4 font-medium rounded-lg cursor-pointer"
    >
      {isConnecting
        ? 'Connecting...'
        : isConnected
        ? `${address?.slice(0, 6)}...${address?.slice(-4)}`
        : 'Connect Wallet'}
    </button>
  );
}
