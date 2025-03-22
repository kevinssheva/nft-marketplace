'use client';

import NFTCard from '@/components/NFTCard';

// Dummy data for NFTs
const dummyNFTs = [
  {
    id: '1',
    name: 'Abstract Dimensions #142',
    image:
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=500',
    price: '0.45',
    creator: {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      name: 'ArtisticMind',
    },
    isListed: true,
  },
  {
    id: '2',
    name: 'Cosmic Perspective',
    image:
      'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?q=80&w=500',
    price: '0.32',
    creator: {
      address: '0xabcdef1234567890abcdef1234567890abcdef12',
      name: 'DigitalDreamer',
    },
    isListed: true,
  },
  {
    id: '3',
    name: 'Neon Landscape',
    image:
      'https://images.unsplash.com/photo-1633537236867-d81fc2208eda?q=80&w=500',
    price: '0.23',
    creator: {
      address: '0x7890abcdef1234567890abcdef1234567890abcd',
      name: 'FutureVision',
    },
    isListed: true,
  },
  {
    id: '4',
    name: 'Crystalline Structure',
    image:
      'https://images.unsplash.com/photo-1543857778-c4a1a9e0b315?q=80&w=500',
    price: '0.19',
    creator: {
      address: '0xdef1234567890abcdef1234567890abcdef123456',
      name: 'CryptoCreator',
    },
    isListed: true,
  },
  {
    id: '5',
    name: 'Digital Wilderness',
    image:
      'https://images.unsplash.com/photo-1592492152545-9695d3f473f4?q=80&w=500',
    price: '0.75',
    creator: {
      address: '0x567890abcdef1234567890abcdef1234567890ab',
      name: 'PixelPioneer',
    },
    isListed: true,
  },
  {
    id: '6',
    name: 'Quantum Fragments',
    image:
      'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?q=80&w=500',
    price: '0.51',
    creator: {
      address: '0x90abcdef1234567890abcdef1234567890abcdef',
      name: 'NeuralArtist',
    },
    isListed: true,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Trending NFTs */}
      <section className="py-16 px-6 ">
        <div className="max-w-7xl mx-auto space-y-10">
          <h2 className="text-3xl font-bold text-text">Listing NFT</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {dummyNFTs.slice(0, 4).map((nft) => (
              <NFTCard
                key={nft.id}
                id={nft.id}
                name={nft.name}
                image={nft.image}
                price={nft.price}
                creator={nft.creator}
                isOwned={false}
                isListed={nft.isListed}
                onBuyClick={() => alert(`You clicked to buy ${nft.name}`)}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
