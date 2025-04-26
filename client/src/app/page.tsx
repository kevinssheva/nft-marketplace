'use client';

import NFTCard from '@/components/NFTCard';
import { useWallet } from '@/context/WalletContext';
import { useContractData } from '@/hooks/useContractData';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const { isConnected } = useWallet();
  const { listings, isLoading, error, fetchListings, buyNFT } =
    useContractData();

  useEffect(() => {
    if (!isConnected) return;
    // Only fetch a small set for the homepage preview
    fetchListings(0, 8);
  }, [isConnected, fetchListings]);

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.2),transparent_50%)]"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="w-full lg:w-1/2 space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold text-text leading-tight">
                Discover, Collect, and Sell Extraordinary NFTs
              </h1>
              <p className="text-xl text-text/80 max-w-xl">
                The world&apos;s first marketplace for music NFTs with royalty
                sharing and listen-to-earn features.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  href="/listings"
                  className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition"
                >
                  Explore NFTs
                </Link>
                <Link
                  href="/mint"
                  className="px-8 py-3 bg-background hover:bg-surface border border-primary text-primary font-medium rounded-lg transition"
                >
                  Create NFT
                </Link>
              </div>
            </div>
            <div className="w-full lg:w-1/2 relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="rounded-xl overflow-hidden border-2 border-primary/30">
                    <Image
                      src="/placeholder-2.jpg"
                      alt="Featured NFT"
                      width={300}
                      height={300}
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="rounded-xl overflow-hidden border-2 border-white/10">
                    <Image
                      src="/placeholder-1.jpg"
                      alt="Featured NFT"
                      width={300}
                      height={300}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
                <div className="space-y-4 transform translate-y-12">
                  <div className="rounded-xl overflow-hidden border-2 border-white/10">
                    <Image
                      src="/placeholder-3.jpg"
                      alt="Featured NFT"
                      width={300}
                      height={300}
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="rounded-xl overflow-hidden border-2 border-primary/30">
                    <Image
                      src="/placeholder-4.jpg"
                      alt="Featured NFT"
                      width={300}
                      height={300}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending NFTs Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-text">Trending NFTs</h2>
              <p className="text-text/70 mt-1">
                Check out the hottest NFTs in our marketplace
              </p>
            </div>
            <Link
              href="/listings"
              className="px-5 py-2 bg-background hover:bg-surface border border-primary text-primary font-medium rounded-lg transition"
            >
              View All
            </Link>
          </div>

          {!isConnected ? (
            <div className="text-center py-20 bg-surface/50 rounded-xl border border-white/10">
              <div className="max-w-md mx-auto">
                <Image
                  src="/globe.svg"
                  alt="Connect Wallet"
                  width={80}
                  height={80}
                  className="mx-auto mb-4 opacity-60"
                />
                <h3 className="text-xl font-semibold text-text mb-2">
                  Connect Your Wallet
                </h3>
                <p className="text-text/70 mb-6">
                  Connect your wallet to explore the NFT marketplace and see
                  real listings.
                </p>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-lg">
              {error}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-20 bg-surface/50 rounded-xl border border-white/10">
              <div className="max-w-md mx-auto">
                <Image
                  src="/placeholder-nft.png"
                  alt="No NFTs"
                  width={80}
                  height={80}
                  className="mx-auto mb-4 opacity-60 rounded-md"
                />
                <h3 className="text-xl font-semibold text-text mb-2">
                  No NFTs Listed
                </h3>
                <p className="text-text/70 mb-6">
                  There are no NFTs listed for sale at the moment. Be the first
                  to mint and list your NFT!
                </p>
                <Link
                  href="/mint"
                  className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition"
                >
                  Mint NFT
                </Link>
              </div>
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

      {/* Features Section */}
      <section className="py-16 px-6 bg-surface/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-text mb-4">
              Why Choose Our NFT Marketplace
            </h2>
            <p className="text-text/70 max-w-2xl mx-auto">
              Our platform offers unique features for creators and collectors in
              the digital art space
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-background p-6 rounded-xl border border-white/10 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5">
              <div className="bg-primary/10 p-3 rounded-lg inline-block mb-4">
                <Image src="/file.svg" alt="Royalties" width={24} height={24} />
              </div>
              <h3 className="text-xl font-semibold text-text mb-2">
                Creator Royalties
              </h3>
              <p className="text-text/70">
                Artists earn royalties on all secondary sales automatically
                through our smart contract.
              </p>
            </div>

            <div className="bg-background p-6 rounded-xl border border-white/10 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5">
              <div className="bg-primary/10 p-3 rounded-lg inline-block mb-4">
                <Image
                  src="/window.svg"
                  alt="Listen-to-Earn"
                  width={24}
                  height={24}
                />
              </div>
              <h3 className="text-xl font-semibold text-text mb-2">
                Listen-to-Earn Model
              </h3>
              <p className="text-text/70">
                Collectors earn rewards when their NFTs are streamed, creating
                passive income.
              </p>
            </div>

            <div className="bg-background p-6 rounded-xl border border-white/10 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5">
              <div className="bg-primary/10 p-3 rounded-lg inline-block mb-4">
                <Image
                  src="/globe.svg"
                  alt="Decentralized"
                  width={24}
                  height={24}
                />
              </div>
              <h3 className="text-xl font-semibold text-text mb-2">
                Decentralized Platform
              </h3>
              <p className="text-text/70">
                Fully on-chain platform with no central authority, giving you
                true ownership of your digital assets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-primary/20 via-primary/10 to-background p-10 rounded-2xl border border-primary/20 text-center">
          <h2 className="text-3xl font-bold text-text mb-4">
            Ready to start your NFT journey?
          </h2>
          <p className="text-text/70 max-w-xl mx-auto mb-8">
            Join our growing community of artists and collectors shaping the
            future of digital ownership.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/mint"
              className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition"
            >
              Create Your First NFT
            </Link>
            <Link
              href="/listings"
              className="px-8 py-3 bg-background hover:bg-surface border border-primary text-primary font-medium rounded-lg transition"
            >
              Browse Marketplace
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
