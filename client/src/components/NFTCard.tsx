'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaEthereum } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { IoArrowForward } from 'react-icons/io5';
import { MdSell, MdInfoOutline } from 'react-icons/md';

interface NFTCardProps {
  id: string;
  name: string;
  image: string;
  price?: string;
  creator: {
    address: string;
    name?: string | null;
  };
  isOwned?: boolean;
  isListed?: boolean;
  onBuyClick?: () => void;
  onListClick?: (id: string) => void;
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
  onListClick,
}: NFTCardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleListClick = () => {
    if (onListClick) {
      onListClick(id);
    }
  };

  return (
    <motion.div
      className="bg-surface rounded-xl overflow-hidden border border-white/10 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 hover:translate-y-[-4px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* NFT Image Container */}
      <div
        className="relative aspect-square overflow-hidden"
        style={{
          background:
            'linear-gradient(45deg, rgba(20,20,30,0.4) 0%, rgba(20,20,30,0.2) 100%)',
        }}
      >
        {isLoading && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {imageError ? (
          <div className="bg-background h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 p-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-primary/50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-text/60 text-sm text-center">
                Image unavailable
              </span>
            </div>
          </div>
        ) : (
          <motion.div
            className="w-full h-full"
            animate={{ scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.3 }}
          >
            <Image
              src={image}
              alt={name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={`object-cover transition-all duration-500 ${
                isLoading ? 'opacity-0 blur-lg' : 'opacity-100 blur-0'
              }`}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setImageError(true);
              }}
            />
          </motion.div>
        )}

        {/* Status badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-20">
          {isOwned && (
            <div className="bg-gradient-to-r from-primary/90 to-primary/70 text-white text-xs px-3 py-1 rounded-full shadow-md backdrop-blur-sm">
              Owned by you
            </div>
          )}

          {isListed && (
            <div className="bg-green-500/80 text-white text-xs px-3 py-1 rounded-full shadow-md backdrop-blur-sm ml-auto">
              For Sale
            </div>
          )}
        </div>
      </div>

      {/* NFT Details */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg text-text truncate" title={name}>
            {name}
          </h3>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
              <svg
                className="w-3.5 h-3.5 text-primary"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm.53 15.28a.75.75 0 01-1.06 0l-3.75-3.75a.75.75 0 111.06-1.06l3.22 3.22 7.22-7.22a.75.75 0 111.06 1.06l-7.75 7.75z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-sm text-text/70">
              {creator.name ||
                `${creator.address.slice(0, 6)}...${creator.address.slice(-4)}`}
            </span>
          </div>

          {/* Price tag */}
          {price && isListed && (
            <div className="flex items-center bg-background/40 px-2 py-1 rounded-lg border border-white/5">
              <FaEthereum className="text-primary mr-1" />
              <span className="font-medium text-text">{price}</span>
            </div>
          )}
        </div>

        {/* Action Buttons - Conditionally displayed based on NFT status */}
        <div className="flex flex-col gap-2 mt-3">
          {/* Primary Action Button - Based on NFT status */}
          {isListed && !isOwned ? (
            // Buy button for listed NFTs that user doesn't own
            <button
              onClick={onBuyClick}
              className="w-full px-4 py-2.5 flex justify-center items-center gap-2 cursor-pointer bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-all hover:shadow-md"
            >
              Buy Now <FaEthereum className="ml-1" />
            </button>
          ) : isOwned && !isListed ? (
            // List for sale button for owned but unlisted NFTs
            <button
              onClick={handleListClick}
              className="w-full px-4 py-2.5 flex justify-center items-center gap-2 cursor-pointer bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-all hover:shadow-md"
            >
              List for Sale <MdSell className="ml-1" />
            </button>
          ) : isOwned && isListed ? (
            // Cancel listing button for owned and listed NFTs
            <button
              onClick={handleListClick}
              className="w-full px-4 py-2.5 flex justify-center items-center gap-2 cursor-pointer bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-all hover:shadow-md"
            >
              Manage Listing <IoArrowForward className="ml-1" />
            </button>
          ) : null}

          {/* Details button - Always present */}
          <Link
            href={`/nft/${id}`}
            className="w-full px-4 py-2.5 flex justify-center items-center gap-2 bg-background hover:bg-background/80 border border-primary/30 text-primary rounded-lg text-sm font-medium transition-all hover:shadow-md hover:border-primary"
          >
            View Details <MdInfoOutline className="ml-1" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default NFTCard;
