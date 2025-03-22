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
      className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
    >
      {isConnecting
        ? 'Connecting...'
        : isConnected
        ? `${address?.slice(0, 6)}...${address?.slice(-4)}`
        : 'Connect Wallet'}
    </button>
  );
}
