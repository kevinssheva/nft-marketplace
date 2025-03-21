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
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        return tokenId;
    }

    /**
     * @dev Allows the owner to list an NFT for sale
     * @param tokenId The ID of the NFT to list
     * @param price The price in wei
     */
    function listNFT(uint256 tokenId, uint256 price) public {
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
     * @dev Owner can adjust the marketplace fee
     * @param newMarketplaceFee The new fee percentage in basis points (1/10000)
     */
    function setMarketplaceFee(uint256 newMarketplaceFee) public onlyOwner {
        require(newMarketplaceFee < 1000, "Fee should be less than 10%");
        marketplaceFeePercentage = newMarketplaceFee;
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
        mintFee = newMintFee;
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
