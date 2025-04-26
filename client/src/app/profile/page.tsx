'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useWallet } from '@/context/WalletContext';
import { useContractData } from '@/hooks/useContractData';
import { FaEthereum } from 'react-icons/fa';
import { IoMdRefresh } from 'react-icons/io';
import Link from 'next/link';
import NFTCard from '@/components/NFTCard';

export default function ProfilePage() {
  const { isConnected, address } = useWallet();
  const { ownedNFTs, isLoading, error, fetchMyNFTs, listNFT } =
    useContractData();

  const [listingPrice, setListingPrice] = useState<string>('');
  const [selectedNFT, setSelectedNFT] = useState<string | null>(null);
  const [isListing, setIsListing] = useState(false);

  // Fetch user's NFTs when wallet is connected
  useEffect(() => {
    if (isConnected) {
      fetchMyNFTs();
    }
  }, [isConnected, fetchMyNFTs]);

  // Handle listing an NFT for sale
  const handleListNFT = async (tokenId: string) => {
    if (!listingPrice || parseFloat(listingPrice) <= 0) {
      alert('Please enter a valid price');
      return;
    }

    setIsListing(true);
    try {
      await listNFT(tokenId, listingPrice);
      setListingPrice('');
      setSelectedNFT(null);

      // Refresh NFTs after listing
      await fetchMyNFTs();
    } catch (err) {
      console.error('Error listing NFT:', err);
    } finally {
      setIsListing(false);
    }
  };

  // Function to refresh NFT data
  const handleRefresh = useCallback(() => {
    if (isConnected) {
      fetchMyNFTs();
    }
  }, [isConnected, fetchMyNFTs]);

  // Format address for display
  const formatAddress = (addr: string | null) => {
    if (addr == null) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text">My NFT Collection</h1>
            <p className="text-text/70 mt-1">
              {isConnected
                ? `Connected: ${formatAddress(address)}`
                : 'Connect your wallet to view your NFTs'}
            </p>
          </div>

          {isConnected && (
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                className="text-white px-4 py-2 bg-background hover:bg-surface border border-white/20 rounded-lg flex items-center gap-2 transition-colors"
                disabled={isLoading}
              >
                <IoMdRefresh className={isLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
              <Link
                href="/mint"
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
              >
                Mint New NFT
              </Link>
            </div>
          )}
        </div>

        {!isConnected ? (
          <div className="flex flex-col items-center justify-center py-20 bg-surface/50 rounded-xl border border-white/10">
            <Image
              src="/globe.svg"
              alt="Connect"
              width={100}
              height={100}
              className="mb-4 opacity-60"
            />
            <h2 className="text-xl font-semibold text-text mb-2">
              Connect Your Wallet
            </h2>
            <p className="text-text/70 text-center max-w-md mb-4">
              Connect your wallet to view your NFT collection and manage your
              assets.
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-lg">
            {error}
          </div>
        ) : ownedNFTs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-surface/50 rounded-xl border border-white/10">
            <Image
              src="/placeholder-nft.png"
              alt="No NFTs"
              width={100}
              height={100}
              className="mb-4 opacity-60"
            />
            <h2 className="text-xl font-semibold text-text mb-2">
              No NFTs Found
            </h2>
            <p className="text-text/70 text-center max-w-md mb-6">
              You don&apos;t own any NFTs yet. Start your collection by minting
              a new NFT.
            </p>
            <Link
              href="/mint"
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition"
            >
              Mint NFT
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Listed NFTs Section */}
            {ownedNFTs.some((nft) => nft.isListed) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-text">
                    Listed for Sale
                  </h2>
                  <span className="text-sm text-text/70 bg-surface px-3 py-1 rounded-full">
                    {ownedNFTs.filter((nft) => nft.isListed).length} NFTs
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {ownedNFTs
                    .filter((nft) => nft.isListed)
                    .map((nft) => (
                      <NFTCard
                        key={nft.id}
                        id={nft.id}
                        name={nft.name}
                        image={nft.image || '/placeholder-nft.png'}
                        price={nft.price}
                        creator={{
                          address: nft.creator?.address || address || '',
                          name: 'You',
                        }}
                        isOwned={true}
                        isListed={true}
                        onListClick={(id) => {
                          setSelectedNFT(id);
                          // For listed NFTs, we would handle canceling or updating the listing
                        }}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Not Listed NFTs Section */}
            {ownedNFTs.some((nft) => !nft.isListed) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-text">
                    Not Listed
                  </h2>
                  <span className="text-sm text-text/70 bg-surface px-3 py-1 rounded-full">
                    {ownedNFTs.filter((nft) => !nft.isListed).length} NFTs
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {ownedNFTs
                    .filter((nft) => !nft.isListed)
                    .map((nft) => (
                      <NFTCard
                        key={nft.id}
                        id={nft.id}
                        name={nft.name}
                        image={nft.image || '/placeholder-nft.png'}
                        price={nft.price}
                        creator={{
                          address: nft.creator?.address || address || '',
                          name: 'You',
                        }}
                        isOwned={true}
                        isListed={false}
                        onListClick={(id) => {
                          setSelectedNFT(id);
                          // Show price input for unlisted NFTs
                          setTimeout(() => {
                            const priceInput = document.getElementById(
                              `price-input-${id}`
                            );
                            if (priceInput) {
                              priceInput.focus();
                            }
                          }, 100);
                        }}
                      />
                    ))}
                </div>

                {/* Listing Dialog Modal */}
                {selectedNFT &&
                  !ownedNFTs.find((nft) => nft.id === selectedNFT)
                    ?.isListed && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
                      <div className="bg-surface p-6 rounded-xl max-w-md w-full border border-white/10 shadow-xl">
                        <h3 className="text-xl font-semibold mb-4 text-text">
                          List NFT for Sale
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-text/70 mb-2">
                              Set Price (ETH)
                            </label>
                            <div className="flex items-center bg-background border border-white/20 rounded-lg overflow-hidden">
                              <input
                                id={`price-input-${selectedNFT}`}
                                type="number"
                                step="0.001"
                                min="0.001"
                                placeholder="Price in ETH"
                                value={listingPrice}
                                onChange={(e) =>
                                  setListingPrice(e.target.value)
                                }
                                className="flex-1 p-3 bg-transparent focus:outline-none text-text px-3"
                              />
                              <div className="px-3 py-2 text-text/70 flex items-center">
                                <FaEthereum className="mr-1" />
                                ETH
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-3 mt-6">
                            <button
                              onClick={() => handleListNFT(selectedNFT)}
                              disabled={
                                isListing ||
                                !listingPrice ||
                                parseFloat(listingPrice) <= 0
                              }
                              className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-lg disabled:opacity-50 transition-colors"
                            >
                              {isListing ? 'Processing...' : 'Confirm Listing'}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedNFT(null);
                                setListingPrice('');
                              }}
                              className="px-4 py-3 bg-background hover:bg-surface border border-white/20 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
