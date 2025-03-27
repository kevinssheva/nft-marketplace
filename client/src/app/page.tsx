'use client';

import NFTCard from '@/components/NFTCard';
import { useWallet } from '@/context/WalletContext';
import { useContractData } from '@/hooks/useContractData';
import { useEffect } from 'react';

export default function Home() {
  const { isConnected } = useWallet();
  const { listings, isLoading, error, fetchListings, buyNFT } =
    useContractData();
  console.log('listings', listings);
  useEffect(() => {
    if (!isConnected) return;
    fetchListings(0, 12);
  }, [isConnected, fetchListings]);

  return (
    <main className="min-h-screen">
      {/* Trending NFTs */}
      <section className="py-16 px-6 ">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-bold text-text">Listed NFTs</h2>

            {!isConnected && (
              <div className="text-text/70">
                Connect wallet to see real listings
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
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map((nft) => (
                <NFTCard
                  key={nft.id}
                  id={nft.id}
                  name={nft.name}
                  image={nft.image}
                  price={nft.price}
                  creator={nft.creator}
                  isOwned={nft.isOwned}
                  isListed={nft.isListed}
                  onBuyClick={() => buyNFT(nft.id, nft.price ? nft.price : '0')}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
