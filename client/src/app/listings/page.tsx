'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import NFTCard from '@/components/NFTCard';
import { useWallet } from '@/context/WalletContext';
import { useContractData } from '@/hooks/useContractData';

export default function ListingsPage() {
  const { isConnected } = useWallet();
  const { listings, isLoading, error, fetchListings, buyNFT } =
    useContractData();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Derived state
  const totalItems = listings.length;
  const totalPages = Math.ceil(totalItems / 10);

  // Fetch listings with current pagination
  useEffect(() => {
    if (!isConnected) return;
    const skip = (currentPage - 1) * 10;
    fetchListings(skip, 10);
  }, [isConnected, fetchListings, currentPage]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle buy NFT
  const handleBuyNFT = async (id: string, price: string) => {
    const success = await buyNFT(id, price);
    if (success) {
      // Refresh the listings after purchase
      fetchListings((currentPage - 1) * 10, 10);
    }
  };

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text">NFT Listings</h1>
            <p className="text-text/70 mt-1">
              Browse and collect unique digital assets
            </p>
          </div>
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
              Connect your wallet to browse the NFT marketplace and see all
              available listings.
            </p>
          </div>
        ) : isLoading && !listings.length ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-lg">
            {error}
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-surface/50 rounded-xl border border-white/10">
            <Image
              src="/placeholder-nft.png"
              alt="No listings"
              width={100}
              height={100}
              className="mb-4 opacity-60 rounded-md"
            />
            <h2 className="text-xl font-semibold text-text mb-2">
              No NFTs Found
            </h2>
            <p className="text-text/70 text-center max-w-md">
              There are no NFTs listed for sale at the moment.
            </p>
          </div>
        ) : (
          <>
            {/* Results count */}
            <div className="mb-4 text-text/70">
              Showing {listings.length} of {totalItems} NFTs
            </div>

            {/* NFT Grid */}
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
                  onBuyClick={() => handleBuyNFT(nft.id, nft.price || '0')}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handlePageChange(Math.max(currentPage - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg border ${
                      currentPage === 1
                        ? 'bg-background/30 border-white/10 text-text/30 cursor-not-allowed'
                        : 'bg-background border-white/20 hover:bg-surface text-text'
                    }`}
                  >
                    Previous
                  </button>

                  <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => handlePageChange(i + 1)}
                        className={`w-10 h-10 rounded-lg ${
                          currentPage === i + 1
                            ? 'bg-primary text-white'
                            : 'bg-background border border-white/20 hover:bg-surface text-text'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() =>
                      handlePageChange(Math.min(currentPage + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg border ${
                      currentPage === totalPages
                        ? 'bg-background/30 border-white/10 text-text/30 cursor-not-allowed'
                        : 'bg-background border-white/20 hover:bg-surface text-text'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
