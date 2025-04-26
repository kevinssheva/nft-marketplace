'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/context/WalletContext';
import { useContractData } from '@/hooks/useContractData';
import Image from 'next/image';
import { IoMdClose } from 'react-icons/io';
import { IoImageOutline, IoInformationCircleOutline } from 'react-icons/io5';
import { useIPFS } from '@/hooks/useIPFS';

export default function MintNFT() {
  const router = useRouter();
  const { isConnected } = useWallet();
  const { mintNFT, isLoading, error } = useContractData();
  const {
    isLoading: isUploading,
    error: uploadError,
    uploadFile,
    uploadMetadata,
  } = useIPFS();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mintStatus, setMintStatus] = useState<
    'idle' | 'uploading' | 'minting' | 'success' | 'error'
  >('idle');

  // Read mint fee from the contract (hardcoded for now - would ideally fetch from contract)
  const mintFee = '0.01';

  // Royalty settings
  const [salesRoyaltyPercentage, setSalesRoyaltyPercentage] = useState(500); // 5% default (500 basis points)
  const [ownerListenPercentage, setOwnerListenPercentage] = useState(2000); // 20% default (2000 basis points)

  const [mintTxHash, setMintTxHash] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Clear preview when file is removed
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
    }
  }, [file]);

  // Handle file selection
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;

      setFile(selectedFile);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    },
    []
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!file || !name || !description) {
      alert('Please fill all required fields');
      return;
    }

    try {
      // Start uploading metadata
      setMintStatus('uploading');
      setUploadProgress(20);

      // Upload image to IPFS
      const imageUri = await uploadFile(file);
      if (!imageUri) {
        throw new Error('Failed to upload image');
      }
      setUploadProgress(50);

      // Create metadata object
      const metadata: NFTMetadataType = {
        name,
        description,
        image: imageUri,
      };

      // Upload metadata to IPFS
      const metadataUri = await uploadMetadata(metadata);
      if (!metadataUri) {
        throw new Error('Failed to upload metadata');
      }
      setUploadProgress(80);

      setMintStatus('minting');

      // Call the mintNFT function with metadata URI and royalty parameters
      const result = await mintNFT(
        metadataUri,
        mintFee,
        salesRoyaltyPercentage,
        ownerListenPercentage
      );

      if (result && result.success) {
        setMintStatus('success');
        setMintTxHash(result.txHash || null);
        setUploadProgress(100);

        // Reset form after successful mint
        setTimeout(() => {
          router.push('/profile'); // Redirect to profile page after minting
        }, 3000);
      } else {
        setMintStatus('error');
        setUploadProgress(0);
      }
    } catch (err) {
      console.error('Error minting NFT:', err);
      setMintStatus('error');
      setUploadProgress(0);
    }
  };

  return (
    <main className="min-h-screen py-16 px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-text mb-8">Create a New NFT</h1>

        {!isConnected ? (
          <div className="bg-primary/10 border border-primary/30 text-primary p-4 rounded-lg mb-8">
            Please connect your wallet to mint NFTs
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* NFT Image Upload */}
            <div className="space-y-2">
              <label className="block text-text font-medium">NFT Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="nft-image"
              />
              <label
                htmlFor="nft-image"
                className="flex flex-col items-center justify-center border-2 border-dashed border-primary/30 rounded-lg p-6 cursor-pointer hover:bg-primary/5 transition-colors"
              >
                {previewUrl ? (
                  <div className="relative w-full aspect-square max-w-xs mx-auto mb-4">
                    <Image
                      src={previewUrl}
                      alt="NFT Preview"
                      fill
                      className="object-contain rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                    >
                      <IoMdClose />
                    </button>
                  </div>
                ) : (
                  <div className="text-center flex items-center flex-col">
                    <IoImageOutline className="w-12 h-12 text-primary" />
                    <p className="mt-1 text-sm text-text">
                      Drag and drop an image, or click to select
                    </p>
                    <p className="mt-1 text-xs text-text/70">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                )}
              </label>
            </div>

            {/* NFT Name */}
            <div className="space-y-2 text-text">
              <label htmlFor="name" className="block font-medium">
                NFT Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome NFT"
                className="w-full px-4 py-2 bg-background border border-primary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            {/* NFT Description */}
            <div className="space-y-2 text-text">
              <label htmlFor="description" className="block font-medium">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell the story behind your NFT..."
                rows={4}
                className="w-full px-4 py-2 bg-background border border-primary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            {/* Royalty Settings */}
            <div className="space-y-4 p-4 bg-surface/30 border border-white/10 rounded-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-text">
                  Royalty Settings
                </h3>
                <div className="group relative flex items-center">
                  <IoInformationCircleOutline className="text-text/70 w-5 h-5" />
                  <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-64 p-2 bg-surface border border-white/10 rounded-lg text-xs text-text/70">
                    Sales royalties are paid when your NFT is resold. Listen
                    royalties are paid when your music NFT is played.
                  </div>
                </div>
              </div>

              {/* Sales Royalty Percentage */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label
                    htmlFor="salesRoyalty"
                    className="block text-sm font-medium text-text"
                  >
                    Sales Royalty ({(salesRoyaltyPercentage / 100).toFixed(1)}%)
                  </label>
                  <span className="text-xs text-text/70">(Max: 10%)</span>
                </div>
                <input
                  type="range"
                  id="salesRoyalty"
                  min="0"
                  max="1000"
                  step="50"
                  value={salesRoyaltyPercentage}
                  onChange={(e) =>
                    setSalesRoyaltyPercentage(parseInt(e.target.value))
                  }
                  className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-text/70">
                  <span>0%</span>
                  <span>10%</span>
                </div>
              </div>

              {/* Listen Royalty Percentage */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label
                    htmlFor="listenRoyalty"
                    className="block text-sm font-medium text-text"
                  >
                    Listen-to-Earn Share (
                    {(ownerListenPercentage / 100).toFixed(1)}%)
                  </label>
                  <span className="text-xs text-text/70">(Max: 50%)</span>
                </div>
                <input
                  type="range"
                  id="listenRoyalty"
                  min="0"
                  max="5000"
                  step="100"
                  value={ownerListenPercentage}
                  onChange={(e) =>
                    setOwnerListenPercentage(parseInt(e.target.value))
                  }
                  className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-text/70">
                  <span>0%</span>
                  <span>50%</span>
                </div>
              </div>
            </div>

            {/* Mint Fee Info */}
            <div className="bg-primary/10 border border-primary/30 text-text p-4 rounded-lg">
              <p className="font-medium">Mint Fee: {mintFee} ETH</p>
              <p className="text-sm mt-1 text-text/70">
                Plus gas fees for the transaction
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                isLoading ||
                isUploading ||
                mintStatus === 'uploading' ||
                mintStatus === 'minting'
              }
              className="w-full px-6 py-3 bg-primary text-white rounded-lg disabled:bg-primary/50 disabled:cursor-not-allowed"
            >
              {mintStatus === 'uploading'
                ? 'Uploading to IPFS...'
                : mintStatus === 'minting'
                ? 'Minting NFT...'
                : 'Mint NFT'}
              {(mintStatus === 'uploading' || mintStatus === 'minting') && (
                <span className="ml-2 inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              )}
            </button>

            {/* Progress Bar (for uploading and minting) */}
            {(mintStatus === 'uploading' || mintStatus === 'minting') && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-text">
                  <span>
                    {mintStatus === 'uploading'
                      ? 'Uploading to IPFS...'
                      : 'Minting on blockchain...'}
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-primary/20 rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Success/Error Messages */}
            {mintStatus === 'success' && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-500 p-4 rounded-lg">
                <p className="font-medium">NFT minted successfully!</p>
                {mintTxHash && (
                  <p className="text-sm mt-1">
                    Transaction:{' '}
                    <a
                      href={`https://etherscan.io/tx/${mintTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      View on Etherscan
                    </a>
                  </p>
                )}
              </div>
            )}

            {(mintStatus === 'error' || error || uploadError) && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-lg">
                <p className="font-medium">Error minting NFT</p>
                <p className="text-sm mt-1">
                  {error || uploadError || 'Please try again'}
                </p>
              </div>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
