// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NFTMarketplace is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 private _nextTokenId;

    // Fee for selling NFT
    uint256 public marketplaceFeePercentage = 250; // 2.5%

    // Fee for minting NFT
    uint256 public mintFee = 0.01 ether;

    struct Listing {
        address seller;
        uint256 price;
        bool isActive;
    }

    mapping(uint256 => Listing) private _listings;

    event NFTMinted(
        uint256 indexed tokenId,
        address indexed creator,
        string uri
    );
    event NFTListed(uint256 tokenId, address seller, uint256 price);
    event NFTSold(
        uint256 tokenId,
        address seller,
        address buyer,
        uint256 price
    );
    event NFTListingUpdated(uint256 tokenId, address seller, uint256 newPrice);
    event NFTListingCancelled(uint256 tokenId, address seller);
    event MarketplaceFeeUpdated(uint256 oldFee, uint256 newFee);
    event MintFeeUpdated(uint256 oldFee, uint256 newFee);

    constructor(
        address initialOwner
    ) ERC721("NFTMarketplace", "NMP") Ownable(initialOwner) {}

    /**
     * @dev Allows anyone to mint an NFT by paying a mint fee
     * @param uri Metadata URI for the NFT
     * @return tokenId The ID of the newly minted NFT
     */
    function mint(
        string memory uri
    ) public payable nonReentrant returns (uint256) {
        require(msg.value >= mintFee, "Insufficient mint fee");

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);

        // Refund excess payment if any
        if (msg.value > mintFee) {
            payable(msg.sender).transfer(msg.value - mintFee);
        }

        emit NFTMinted(tokenId, msg.sender, uri);
        return tokenId;
    }

    /**
     * @dev Owner can mint NFTs without paying a fee (for special cases)
     * @param to Recipient of the NFT
     * @param uri Metadata URI for the NFT
     * @return tokenId The ID of the newly minted NFT
     */
    function safeMint(
        address to,
        string memory uri
    ) public onlyOwner returns (uint256) {
        require(to != address(0), "Invalid recipient address");
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        emit NFTMinted(tokenId, to, uri);
        return tokenId;
    }

    /**
     * @dev Allows the owner to list an NFT for sale
     * @param tokenId The ID of the NFT to list
     * @param price The price in wei
     */
    function listNFT(uint256 tokenId, uint256 price) public nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Not the owner of the NFT");
        require(price > 0, "Price should be greater than 0");
        require(!_listings[tokenId].isActive, "NFT is already listed");

        _listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            isActive: true
        });

        approve(address(this), tokenId);
        emit NFTListed(tokenId, msg.sender, price);
    }

    /**
     * @dev Allows the owner to update the price of a listed NFT
     * @param tokenId The ID of the NFT to update
     * @param newPrice The new price in wei
     */
    function updateListingPrice(uint256 tokenId, uint256 newPrice) public {
        require(ownerOf(tokenId) == msg.sender, "Not the owner of the NFT");
        require(_listings[tokenId].isActive, "NFT is not listed");
        require(newPrice > 0, "Price should be greater than 0");

        _listings[tokenId].price = newPrice;
        emit NFTListingUpdated(tokenId, msg.sender, newPrice);
    }

    /**
     * @dev Allows the owner to cancel a listing
     * @param tokenId The ID of the NFT to cancel
     */
    function cancelListing(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Not the owner of the NFT");
        require(_listings[tokenId].isActive, "NFT is not listed");

        _listings[tokenId].isActive = false;
        emit NFTListingCancelled(tokenId, msg.sender);
    }

    /**
     * @dev Allows anyone to buy an NFT
     * @param tokenId The ID of the NFT to buy
     */
    function buyNFT(uint256 tokenId) public payable nonReentrant {
        Listing memory listing = _listings[tokenId];
        require(listing.isActive, "NFT is not listed for sale");
        require(msg.value >= listing.price, "Insufficient funds");
        require(
            _ownerOf(tokenId) == listing.seller,
            "NFT is no longer owned by the seller"
        );

        _listings[tokenId].isActive = false;

        uint256 marketplaceFee = (listing.price * marketplaceFeePercentage) /
            10000;
        uint256 sellerProceeds = listing.price - marketplaceFee;

        _transfer(listing.seller, msg.sender, tokenId);

        payable(listing.seller).transfer(sellerProceeds);

        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }

        emit NFTSold(tokenId, listing.seller, msg.sender, listing.price);
    }

    /**
     * @dev Fetches the details of an NFT listing
     * @param tokenId The ID of the NFT
     * @return seller The address of the seller
     * @return price The price of the NFT
     * @return isActive Whether the listing is active
     */
    function getListing(
        uint256 tokenId
    ) public view returns (address seller, uint256 price, bool isActive) {
        Listing memory listing = _listings[tokenId];
        return (listing.seller, listing.price, listing.isActive);
    }

    /**
     * @dev Fetches all active listings (paginated)
     * @param skip The number of listings to skip
     * @param take The number of listings to fetch
     * @return tokenIds The IDs of the NFTs listed for sale
     * @return sellers The addresses of the sellers
     * @return prices The prices of the NFTs
     */
    function getAllListings(
        uint256 skip,
        uint256 take
    )
        public
        view
        returns (
            uint256[] memory tokenIds,
            address[] memory sellers,
            uint256[] memory prices
        )
    {
        uint256 totalActive = 0;
        for (uint256 i = 0; i < _nextTokenId; i++) {
            if (_listings[i].isActive) {
                totalActive++;
            }
        }

        uint256 resultCount = take;
        if (skip >= totalActive) {
            resultCount = 0;
        } else if (skip + take > totalActive) {
            resultCount = totalActive - skip;
        }

        tokenIds = new uint256[](resultCount);
        sellers = new address[](resultCount);
        prices = new uint256[](resultCount);

        uint256 resultIndex = 0;
        uint256 skipped = 0;

        for (
            uint256 i = 0;
            i < _nextTokenId && resultIndex < resultCount;
            i++
        ) {
            if (_listings[i].isActive) {
                if (skipped < skip) {
                    skipped++;
                    continue;
                }

                tokenIds[resultIndex] = i;
                sellers[resultIndex] = _listings[i].seller;
                prices[resultIndex] = _listings[i].price;
                resultIndex++;
            }
        }

        return (tokenIds, sellers, prices);
    }

    /**
     * @dev Fetches all NFTs owned by an address
     * @param seller The address of the owner
     * @return tokenIds The IDs of the NFTs owned by the address
     * @return prices The prices of the NFTs
     */
    function getListingsBySeller(
        address seller
    ) public view returns (uint256[] memory tokenIds, uint256[] memory prices) {
        uint256 count = 0;
        for (uint256 i = 0; i < _nextTokenId; i++) {
            if (_listings[i].isActive && _listings[i].seller == seller) {
                count++;
            }
        }

        tokenIds = new uint256[](count);
        prices = new uint256[](count);

        uint256 resultIndex = 0;
        for (uint256 i = 0; i < _nextTokenId && resultIndex < count; i++) {
            if (_listings[i].isActive && _listings[i].seller == seller) {
                tokenIds[resultIndex] = i;
                prices[resultIndex] = _listings[i].price;
                resultIndex++;
            }
        }

        return (tokenIds, prices);
    }

    /**
     * @dev Fetches all NFTs owned by an address
     * @param owner The address of the owner
     * @return Array of token IDs owned by the address
     */
    function getNFTsByOwner(
        address owner
    ) public view returns (uint256[] memory) {
        uint256 count = balanceOf(owner);

        uint256[] memory tokenIds = new uint256[](count);

        uint256 resultIndex = 0;

        for (uint256 i = 0; i < _nextTokenId && resultIndex < count; i++) {
            if (_ownerOf(i) == owner) {
                tokenIds[resultIndex] = i;
                resultIndex++;
            }
        }

        return tokenIds;
    }

    /**
     * @dev Fetches sender's listings
     * @return tokenIds The IDs of the NFTs listed by the sender
     * @return prices The prices of the NFTs
     */
    function getMyListings()
        public
        view
        returns (uint256[] memory tokenIds, uint256[] memory prices)
    {
        return getListingsBySeller(msg.sender);
    }

    /**
     * @dev Fetches sender's NFTs
     * @return Array of token IDs owned by the sender
     */
    function getMyNFTs() public view returns (uint256[] memory) {
        return getNFTsByOwner(msg.sender);
    }

    /**
     * @dev Owner can adjust the marketplace fee
     * @param newMarketplaceFee The new fee percentage in basis points (1/10000)
     */
    function setMarketplaceFee(uint256 newMarketplaceFee) public onlyOwner {
        require(newMarketplaceFee < 1000, "Fee should be less than 10%");
        uint256 oldFee = marketplaceFeePercentage;
        marketplaceFeePercentage = newMarketplaceFee;
        emit MarketplaceFeeUpdated(oldFee, newMarketplaceFee);
    }

    /**
     * @dev Allows anyone to see the current marketplace fee
     * @return marketplaceFeePercentage The current marketplace fee
     */
    function getMarketplaceFee() public view returns (uint256) {
        return marketplaceFeePercentage;
    }

    /**
     * @dev Owner can adjust the mint fee
     * @param newMintFee New fee amount in wei
     */
    function setMintFee(uint256 newMintFee) public onlyOwner {
        uint256 oldFee = mintFee;
        mintFee = newMintFee;
        emit MintFeeUpdated(oldFee, newMintFee);
    }

    /**
     * @dev Owner can withdraw accumulated fees
     */
    function withdrawFees() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner()).transfer(balance);
    }

    // The following functions are overrides required by Solidity.
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
