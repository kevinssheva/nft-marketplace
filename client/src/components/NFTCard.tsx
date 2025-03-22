'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaEthereum } from 'react-icons/fa';

interface NFTCardProps {
  id: string;
  name: string;
  image: string;
  price?: string;
  creator: {
    address: string;
    name?: string;
  };
  isOwned?: boolean;
  isListed?: boolean;
  onBuyClick?: () => void;
}

const NFTCard = ({
  id,
  name,
  image,
  price,
  creator,
  isOwned = false,
  isListed = true,
  onBuyClick,
}: NFTCardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  return (
    <div className="bg-card rounded-xl overflow-hidden border border-white/20 transition-shadow duration-300 bg-surface">
      {/* NFT Image */}
      <div className="relative aspect-square">
        {isLoading && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {imageError ? (
          <div className="bg-background h-full flex items-center justify-center">
            <span className="text-text/60">Image unavailable</span>
          </div>
        ) : (
          <Image
            src={image}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={`object-cover transition-opacity duration-300 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setImageError(true);
            }}
          />
        )}

        {/* Owner badge */}
        {isOwned && (
          <div className="absolute top-2 right-2 bg-primary/90 text-white text-xs px-2 py-1 rounded-lg">
            Owned
          </div>
        )}
      </div>

      {/* NFT Details */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg text-text truncate" title={name}>
            {name}
          </h3>
        </div>

        <div className="text-sm text-text/70 mb-3">
          by{' '}
          <span className="text-primary hover:text-primary/80">
            {creator.name ||
              `${creator.address.slice(0, 6)}...${creator.address.slice(-4)}`}
          </span>
        </div>

        {/* Price */}
        {price && (
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center">
              <FaEthereum className="text-primary mr-1" />
              <span className="font-medium text-text">{price}</span>
            </div>
            {isListed && <span className="text-xs text-text/60">Listed</span>}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 mt-2">
          <Link
            href={`/nft/${id}`}
            className="flex-1 px-3 py-2 text-center bg-background hover:bg-background/80 border border-primary text-primary rounded-lg text-sm transition-colors"
          >
            View Details
          </Link>

          {isListed && !isOwned && price && (
            <button
              onClick={onBuyClick}
              className="flex-1 px-3 py-2 cursor-pointer bg-primary hover:bg-primary/90 text-white rounded-lg text-sm transition-colors"
            >
              Buy Now
            </button>
          )}

          {isOwned && !isListed && (
            <Link
              href={`/nft/${id}/list`}
              className="flex-1 px-3 py-2 bg-primary/90 hover:bg-primary text-white rounded-lg text-sm transition-colors"
            >
              List for Sale
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default NFTCard;
