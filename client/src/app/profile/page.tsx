'use client';

import NFTCard from '@/components/NFTCard';
import { useWallet } from '@/context/WalletContext';
import { useContractData } from '@/hooks/useContractData';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function ProfilePage() {
  const { isConnected, address } = useWallet();
  const { ownedNFTs, isLoading, error, fetchMyNFTs, listNFT } =
    useContractData();
  const [listingPrice, setListingPrice] = useState<string>('');
  const [selectedNFT, setSelectedNFT] = useState<string | null>(null);
  const [isListing, setIsListing] = useState(false);

  useEffect(() => {
    if (!isConnected) return;
    fetchMyNFTs();
  }, [isConnected, fetchMyNFTs]);

  const handleListNFT = async (tokenId: string) => {
    if (!listingPrice) return;

    setIsListing(true);
    try {
      await listNFT(tokenId, listingPrice);
      setListingPrice('');
      setSelectedNFT(null);
    } catch (err) {
      console.error('Error listing NFT:', err);
    } finally {
      setIsListing(false);
    }
  };

  return (
    <main className="min-h-screen py-16 px-6">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col gap-4">
          <h2 className="text-3xl font-bold text-text">My NFT Collection</h2>

          {!isConnected ? (
            <div className="text-text/70">Connect wallet to view your NFTs</div>
          ) : (
            <div className="text-text/70">
              Wallet: {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-lg">
            {error}
          </div>
        ) : ownedNFTs.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-medium mb-2">No NFTs Found</h3>
            <p className="text-text/70">You dont own any NFTs yet.</p>
          </div>
        ) : (
          <>
            {/* NFTs already listed for sale */}
            {ownedNFTs.some((nft) => nft.isListed) && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Listed for Sale</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {ownedNFTs
                    .filter((nft) => nft.isListed)
                    .map((nft) => (
                      <NFTCard
                        key={nft.id}
                        id={nft.id}
                        name={nft.name}
                        image={nft.image}
                        price={nft.price}
                        creator={{ address: '', name: 'You' }}
                        isOwned={true}
                        isListed={true}
                        onBuyClick={() => {}}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* NFTs not listed for sale */}
            {ownedNFTs.some((nft) => !nft.isListed) && (
              <div className="space-y-4 mt-10 text-text">
                <h3 className="text-xl font-semibold">Not Listed</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {ownedNFTs
                    .filter((nft) => !nft.isListed)
                    .map((nft) => (
                      <div
                        key={nft.id}
                        className="border border-border rounded-xl overflow-hidden bg-card"
                      >
                        <div className="aspect-square overflow-hidden">
                          <Image
                            src={nft.image || '/placeholder-nft.png'}
                            alt={nft.name}
                            width={400}
                            height={400}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-nft.png';
                            }}
                          />
                        </div>
                        <div className="p-4 space-y-3">
                          <h3 className="font-medium text-lg truncate">
                            {nft.name}
                          </h3>

                          {selectedNFT === nft.id ? (
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <input
                                  type="text"
                                  placeholder="Price in ETH"
                                  value={listingPrice}
                                  onChange={(e) =>
                                    setListingPrice(e.target.value)
                                  }
                                  className="flex-1 p-2 border border-border rounded-l-md focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                                <span className="bg-background text-text/70 p-2 border border-l-0 border-border rounded-r-md">
                                  ETH
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleListNFT(nft.id)}
                                  disabled={isListing || !listingPrice}
                                  className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium p-2 rounded-md disabled:opacity-50"
                                >
                                  {isListing ? 'Listing...' : 'List NFT'}
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedNFT(null);
                                    setListingPrice('');
                                  }}
                                  className="px-3 py-2 border border-border rounded-md hover:bg-background/80"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSelectedNFT(nft.id)}
                              className="w-full bg-primary hover:bg-primary/90 text-white font-medium p-2 rounded-md"
                            >
                              List for Sale
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
