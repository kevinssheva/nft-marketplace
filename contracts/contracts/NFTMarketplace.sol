// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC2981} from "@openzeppelin/contracts/interfaces/IERC2981.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/**
 * @title NFTMarketplace
 * @dev A marketplace for minting, listing, and trading NFTs with royalty support
 */
contract NFTMarketplace is
    ERC721,
    ERC721URIStorage,
    Ownable,
    ReentrancyGuard,
    IERC2981
{
    // ================ CUSTOM ERRORS ================
    error InsufficientMintFee();
    error RoyaltyTooHigh();
    error InvalidAddress();
    error NotTokenOwner();
    error InvalidPrice();
    error AlreadyListed();
    error NotListed();
    error NoLongerOwnedBySeller();
    error InsufficientFunds();
    error NoFeesToWithdraw();
    error NoRoyaltiesToWithdraw();
    error FeeTooHigh();
    error EmptyTokenArray();
    error ArrayLengthMismatch();
    error InsufficientBatchPayment();

    // ================ STATE VARIABLES ================
    uint256 private _nextTokenId;

    // Fee structure
    uint256 public marketplaceFeePercentage = 250; // 2.5%
    uint256 public mintFee = 0.01 ether;
    uint256 private _accumulatedPlatformFees;

    // ================ DATA STRUCTURES ================
    struct Listing {
        address seller;
        uint256 price;
        bool isActive;
    }

    struct RoyaltyInfo {
        address artistAddress;
        uint256 salesRoyaltyPercentage;
        uint256 ownerListenPercentage;
    }

    // ================ MAPPINGS ================
    mapping(uint256 => Listing) private _listings;
    mapping(uint256 => RoyaltyInfo) private _royalties;
    mapping(address => uint256) private _pendingRoyalties;

    // Active listings storage
    uint256[] private _activeListingIds;
    mapping(uint256 => uint256) private _activeListingIndex;

    // ================ EVENTS ================
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
    event FeesWithdrawn(address indexed owner, uint256 amount);
    event ListenRecorded(
        uint256 indexed tokenId,
        address indexed listener,
        uint256 amount,
        address owner,
        address artist
    );
    event RoyaltyWithdrawn(address indexed recipient, uint256 amount);

    // ================ CONSTRUCTOR ================
    constructor(
        address initialOwner
    ) ERC721("NFTMarketplace", "NMP") Ownable(initialOwner) {}

    // ================ CORE NFT FUNCTIONS ================
    /**
     * @dev Allows anyone to mint an NFT by paying a mint fee
     * @param uri Metadata URI for the NFT
     * @param salesRoyaltyPercentage Percentage of royalties (in basis points)
     * @param ownerListenPercentage Percentage of royalties for listening (in basis points)
     * @return tokenId The ID of the newly minted NFT
     */
    function mint(
        string memory uri,
        uint256 salesRoyaltyPercentage,
        uint256 ownerListenPercentage
    ) public payable nonReentrant returns (uint256) {
        if (msg.value < mintFee) revert InsufficientMintFee();
        if (salesRoyaltyPercentage > 10000) revert RoyaltyTooHigh();
        if (ownerListenPercentage > 5000) revert RoyaltyTooHigh();

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        _setTokenRoyalty(
            tokenId,
            msg.sender,
            salesRoyaltyPercentage,
            ownerListenPercentage
        );

        _accumulatedPlatformFees += mintFee;

        // Refund excess payment if any
        if (msg.value > mintFee) {
            payable(msg.sender).transfer(msg.value - mintFee);
        }

        emit NFTMinted(tokenId, msg.sender, uri);
        return tokenId;
    }

    // ================ MARKETPLACE FUNCTIONS ================
    /**
     * @dev Allows the owner to list an NFT for sale
     * @param tokenId The ID of the NFT to list
     * @param price The price in wei
     */
    function listNFT(uint256 tokenId, uint256 price) public nonReentrant {
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        if (price == 0) revert InvalidPrice();
        if (_listings[tokenId].isActive) revert AlreadyListed();

        _listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            isActive: true
        });

        _activeListingIds.push(tokenId);
        _activeListingIndex[tokenId] = _activeListingIds.length - 1;

        approve(address(this), tokenId);
        emit NFTListed(tokenId, msg.sender, price);
    }

    /**
     * @dev Allows the owner to update the price of a listed NFT
     * @param tokenId The ID of the NFT to update
     * @param newPrice The new price in wei
     */
    function updateListingPrice(uint256 tokenId, uint256 newPrice) public {
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        if (!_listings[tokenId].isActive) revert NotListed();
        if (newPrice == 0) revert InvalidPrice();

        _listings[tokenId].price = newPrice;
        emit NFTListingUpdated(tokenId, msg.sender, newPrice);
    }

    /**
     * @dev Allows the owner to cancel a listing
     * @param tokenId The ID of the NFT to cancel
     */
    function cancelListing(uint256 tokenId) public {
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        if (!_listings[tokenId].isActive) revert NotListed();

        _listings[tokenId].isActive = false;
        _removeActiveListing(tokenId);
        approve(address(0), tokenId);

        emit NFTListingCancelled(tokenId, msg.sender);
    }

    /**
     * @dev Allows anyone to buy an NFT
     * @param tokenId The ID of the NFT to buy
     */
    function buyNFT(uint256 tokenId) public payable nonReentrant {
        Listing memory listing = _listings[tokenId];
        if (!listing.isActive) revert NotListed();
        if (msg.value < listing.price) revert InsufficientFunds();
        if (_ownerOf(tokenId) != listing.seller) revert NoLongerOwnedBySeller();

        _listings[tokenId].isActive = false;
        _removeActiveListing(tokenId);

        uint256 marketplaceFee = (listing.price * marketplaceFeePercentage) /
            10000;
        _accumulatedPlatformFees += marketplaceFee;

        RoyaltyInfo memory royalty = _royalties[tokenId];
        uint256 artistRoyalty = (listing.price *
            royalty.salesRoyaltyPercentage) / 10000;
        uint256 sellerProceeds = listing.price - marketplaceFee - artistRoyalty;

        _transfer(listing.seller, msg.sender, tokenId);

        if (artistRoyalty > 0 && royalty.artistAddress != address(0)) {
            _pendingRoyalties[royalty.artistAddress] += artistRoyalty;
        }

        if (sellerProceeds > 0) {
            _pendingRoyalties[listing.seller] += sellerProceeds;
        }

        // Refund excess payment
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }

        emit NFTSold(tokenId, listing.seller, msg.sender, listing.price);
    }

    // ================ ROYALTY FUNCTIONS ================
    /**
     * @dev Records a listen event but accumulates royalties for monthly distribution
     * @param tokenId The ID of the NFT
     */
    function recordListen(uint256 tokenId) public payable nonReentrant {
        RoyaltyInfo memory royalty = _royalties[tokenId];
        address currentOwner = ownerOf(tokenId);
        if (msg.value == 0) revert InsufficientFunds();

        // Calculate owner's share for listening
        uint256 ownerShare = (msg.value * royalty.ownerListenPercentage) /
            10000;
        uint256 artistShare = msg.value - ownerShare;

        // Accumulate royalties
        if (ownerShare > 0 && currentOwner != address(0)) {
            _pendingRoyalties[currentOwner] += ownerShare;
        }

        if (artistShare > 0 && royalty.artistAddress != address(0)) {
            _pendingRoyalties[royalty.artistAddress] += artistShare;
        }

        emit ListenRecorded(
            tokenId,
            msg.sender,
            msg.value,
            currentOwner,
            royalty.artistAddress
        );
    }

    /**
     * @dev Records multiple listen events in a single transaction
     * @param tokenIds Array of NFT token IDs
     * @param amounts Array of payment amounts for each listen
     */
    function recordBatchListens(
        uint256[] calldata tokenIds,
        uint256[] calldata amounts
    ) public payable nonReentrant {
        if (tokenIds.length == 0) revert EmptyTokenArray();
        if (tokenIds.length != amounts.length) revert ArrayLengthMismatch();

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        if (msg.value < totalAmount) revert InsufficientBatchPayment();

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            uint256 amount = amounts[i];

            if (amount == 0) revert InsufficientFunds();

            RoyaltyInfo memory royalty = _royalties[tokenId];
            address currentOwner = ownerOf(tokenId);

            // Calculate owner's share for listening
            uint256 ownerShare = (amount * royalty.ownerListenPercentage) /
                10000;
            uint256 artistShare = amount - ownerShare;

            // Accumulate royalties
            if (ownerShare > 0 && currentOwner != address(0)) {
                _pendingRoyalties[currentOwner] += ownerShare;
            }

            if (artistShare > 0 && royalty.artistAddress != address(0)) {
                _pendingRoyalties[royalty.artistAddress] += artistShare;
            }

            emit ListenRecorded(
                tokenId,
                msg.sender,
                amount,
                currentOwner,
                royalty.artistAddress
            );
        }

        // Refund excess payment if any
        if (msg.value > totalAmount) {
            payable(msg.sender).transfer(msg.value - totalAmount);
        }
    }

    /**
     * @dev Allows users to withdraw their accumulated royalties
     */
    function withdrawRoyalties() public nonReentrant {
        uint256 amount = _pendingRoyalties[msg.sender];
        if (amount == 0) revert NoRoyaltiesToWithdraw();

        _pendingRoyalties[msg.sender] = 0;
        payable(msg.sender).transfer(amount);

        emit RoyaltyWithdrawn(msg.sender, amount);
    }

    // ================ FEE MANAGEMENT FUNCTIONS ================
    /**
     * @dev Owner can adjust the marketplace fee
     * @param newMarketplaceFee The new fee percentage in basis points (1/10000)
     */
    function setMarketplaceFee(uint256 newMarketplaceFee) public onlyOwner {
        if (newMarketplaceFee >= 1000) revert FeeTooHigh();
        uint256 oldFee = marketplaceFeePercentage;
        marketplaceFeePercentage = newMarketplaceFee;
        emit MarketplaceFeeUpdated(oldFee, newMarketplaceFee);
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
        uint256 amount = _accumulatedPlatformFees;
        if (amount == 0) revert NoFeesToWithdraw();

        _accumulatedPlatformFees = 0;
        payable(owner()).transfer(amount);

        emit FeesWithdrawn(owner(), amount);
    }

    // ================ QUERY FUNCTIONS ================
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
        uint256 totalActive = _activeListingIds.length;

        uint256 resultCount = take;
        if (skip >= totalActive) {
            resultCount = 0;
        } else if (skip + take > totalActive) {
            resultCount = totalActive - skip;
        }

        tokenIds = new uint256[](resultCount);
        sellers = new address[](resultCount);
        prices = new uint256[](resultCount);

        for (uint256 i = 0; i < resultCount; i++) {
            uint256 tokenId = _activeListingIds[skip + i];
            tokenIds[i] = tokenId;
            sellers[i] = _listings[tokenId].seller;
            prices[i] = _listings[tokenId].price;
        }

        return (tokenIds, sellers, prices);
    }

    /**
     * @dev Fetches all NFTs listed by a specific seller
     * @param seller The address of the seller
     * @return tokenIds The IDs of the NFTs listed by the seller
     * @return prices The prices of the NFTs
     */
    function getListingsBySeller(
        address seller
    ) public view returns (uint256[] memory tokenIds, uint256[] memory prices) {
        uint256 count = 0;
        for (uint256 i = 0; i < _activeListingIds.length; i++) {
            uint256 tokenId = _activeListingIds[i];
            if (_listings[tokenId].seller == seller) {
                count++;
            }
        }

        tokenIds = new uint256[](count);
        prices = new uint256[](count);

        uint256 resultIndex = 0;
        for (uint256 i = 0; i < _activeListingIds.length; i++) {
            uint256 tokenId = _activeListingIds[i];
            if (_listings[tokenId].seller == seller) {
                tokenIds[resultIndex] = tokenId;
                prices[resultIndex] = _listings[tokenId].price;
                resultIndex++;
            }
        }

        return (tokenIds, prices);
    }

    /**
     * @dev Fetches all NFTs owned by an address
     * @param owner The address of the owner
     * @return tokenIds Array of token IDs owned by the address
     * @return isListed Array of booleans indicating if each token is listed
     */
    function getNFTsByOwner(
        address owner
    ) public view returns (uint256[] memory tokenIds, bool[] memory isListed) {
        uint256 count = balanceOf(owner);
        tokenIds = new uint256[](count);
        isListed = new bool[](count);
        uint256 resultIndex = 0;

        for (uint256 i = 0; i < _nextTokenId && resultIndex < count; i++) {
            if (_ownerOf(i) == owner) {
                tokenIds[resultIndex] = i;
                isListed[resultIndex] = _listings[i].isActive;
                resultIndex++;
            }
        }

        return (tokenIds, isListed);
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
     * @return tokenIds Array of token IDs owned by the address
     * @return isListed Array of booleans indicating if each token is listed
     */
    function getMyNFTs()
        public
        view
        returns (uint256[] memory tokenIds, bool[] memory isListed)
    {
        return getNFTsByOwner(msg.sender);
    }

    // ================ ROYALTY INTERFACE IMPLEMENTATION ================
    function royaltyInfo(
        uint256 tokenId,
        uint256 salePrice
    ) external view override returns (address receiver, uint256 royaltyAmount) {
        RoyaltyInfo memory royalty = _royalties[tokenId];
        royaltyAmount = (salePrice * royalty.salesRoyaltyPercentage) / 10000;
        return (royalty.artistAddress, royaltyAmount);
    }

    // ================ HELPER FUNCTIONS ================
    /**
     * @dev Sets the royalty information for a specific token
     * @param tokenId The ID of the token
     * @param artistAddress The address to receive royalties
     * @param salesRoyaltyPercentage The percentage of royalties (in basis points)
     * @param ownerListenPercentage The percentage of royalties for listening (in basis points)
     */
    function _setTokenRoyalty(
        uint256 tokenId,
        address artistAddress,
        uint256 salesRoyaltyPercentage,
        uint256 ownerListenPercentage
    ) internal {
        _royalties[tokenId] = RoyaltyInfo({
            artistAddress: artistAddress,
            salesRoyaltyPercentage: salesRoyaltyPercentage,
            ownerListenPercentage: ownerListenPercentage
        });
    }

    /**
     * @dev Removes listing from the active listings
     * @param tokenId The ID of the token
     */
    function _removeActiveListing(uint256 tokenId) private {
        uint256 lastListingIndex = _activeListingIds.length - 1;
        uint256 listingIndex = _activeListingIndex[tokenId];

        if (listingIndex != lastListingIndex) {
            uint256 lastTokenId = _activeListingIds[lastListingIndex];
            _activeListingIndex[lastTokenId] = listingIndex;
            _activeListingIds[listingIndex] = lastTokenId;
        }

        _activeListingIds.pop();
        delete _activeListingIndex[tokenId];
    }

    // ================ FINANCIAL INFO FUNCTIONS ================
    /**
     * @dev Allows anyone to see the current marketplace fee
     * @return The current marketplace fee percentage
     */
    function getMarketplaceFee() public view returns (uint256) {
        return marketplaceFeePercentage;
    }

    /**
     * @dev Returns the accumulated platform fees available for withdrawal
     * @return The amount of platform fees
     */
    function getAccumulatedPlatformFees() external view returns (uint256) {
        return _accumulatedPlatformFees;
    }

    /**
     * @dev Returns the total pending royalties (excluding platform fees)
     * @return The total amount of pending royalties
     */
    function getTotalPendingRoyalties() external view returns (uint256) {
        return address(this).balance - _accumulatedPlatformFees;
    }

    /**
     * @dev Returns pending royalties for a specific address
     * @param recipient The address to check
     * @return The amount of pending royalties
     */
    function getPendingRoyaltiesForAddress(
        address recipient
    ) external view returns (uint256) {
        return _pendingRoyalties[recipient];
    }

    // ================ OVERRIDE FUNCTIONS ================
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage, IERC165) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
