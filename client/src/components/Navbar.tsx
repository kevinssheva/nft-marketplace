'use client';

import { useState } from 'react';
import Link from 'next/link';
import ConnectWalletButton from './ConnectWalletButton';
import { HiMenu, HiX } from 'react-icons/hi'; // Import React Icons

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-background border-b border-border/40 py-4 px-6 md:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-primary">
                NFT Market
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-text hover:text-primary font-medium">
              Home
            </Link>
            <Link
              href="/explore"
              className="text-text hover:text-primary font-medium"
            >
              Explore
            </Link>
            <Link
              href="/create"
              className="text-text hover:text-primary font-medium"
            >
              Create
            </Link>
            <Link
              href="/my-nfts"
              className="text-text hover:text-primary font-medium"
            >
              My NFTs
            </Link>
          </div>

          {/* Connect Wallet Button (Desktop) */}
          <div className="hidden md:block">
            <ConnectWalletButton />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-text focus:outline-none"
            >
              {isOpen ? (
                <HiX className="h-6 w-6" />
              ) : (
                <HiMenu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-border/40">
            <div className="flex flex-col space-y-4 pb-3">
              <Link
                href="/"
                className="text-text hover:text-primary font-medium"
              >
                Home
              </Link>
              <Link
                href="/explore"
                className="text-text hover:text-primary font-medium"
              >
                Explore
              </Link>
              <Link
                href="/create"
                className="text-text hover:text-primary font-medium"
              >
                Create
              </Link>
              <Link
                href="/my-nfts"
                className="text-text hover:text-primary font-medium"
              >
                My NFTs
              </Link>

              <div className="pt-2">
                <ConnectWalletButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
