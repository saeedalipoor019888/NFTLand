//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

// we can use https://www.erc721a.org/ , but in PDF file asked me to use openzeppelin ! cost with https://www.erc721a.org/ is more optimized for mint multiple tokens

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract VWorld is ERC721URIStorage, Ownable, ReentrancyGuard {
    // using counter to set dedicated id per any land
    using Counters for Counters.Counter;
    Counters.Counter public landIDTracker;

    // maximum lands that we can mint
    uint256 maxID = 3;

    event LandItemCreated(
        uint256 indexed landID,
        address seller,
        address owner,
        uint256 price
    );

    event LandItemBought(
        uint256 indexed landID,
        uint256 price,
        address indexed seller,
        address indexed buyer
    );

    // market struct for land item
    // we can add owner history as array in this struct
    struct LandItem {
        uint256 landID;
        address payable seller;
        address payable[] owner;
        uint256 price;
        bool sold;
    }
    mapping(uint256 => LandItem) private IDToLandItem;

    // modifier to check that give id for NFT item is valid or no !
    modifier validID(uint256 _landID) {
        require(
            _landID > 0 && _landID <= landIDTracker.current(),
            "invalid land item id"
        );
        _;
    }

    constructor() ERC721("VWorld", "VW") {}

    // /// //////////////////////////////////////////////////////////////////////////////////////////////// SETTER FUNCTIONS

    function mintLand(string calldata _landURI) public onlyOwner {
        // increase id for new land
        landIDTracker.increment();

        // get new id for new land
        uint256 _landID = landIDTracker.current();

        // we are using this requirement to avoide mint more than maximum lands !
        require(
            _landID <= maxID,
            "you can't mint more land !, maxID is reached !"
        );

        //mint new land for function caller
        _mint(msg.sender, _landID);

        // set URI for new minted land
        _setTokenURI(_landID, _landURI);

        // list land item to sell directly after mint
        createMarketItem(_landID, 1 ether);
    }

    function createMarketItem(uint256 _landID, uint256 _price) private {
        // we check listing price is more than 0
        require(_price > 0, "Price must be at least 1 wei");

        // we add land item to mapping by id
        LandItem memory _newLandItem;
        _newLandItem.landID = _landID;
        _newLandItem.seller = payable(msg.sender);
        _newLandItem.price = _price;
        _newLandItem.sold = false;

        IDToLandItem[_landID] = _newLandItem;
        IDToLandItem[_landID].owner.push(payable(address(this)));

        // we transfer land item ownership from msg sender to marketplace
        _transfer(msg.sender, address(this), _landID);

        emit LandItemCreated(_landID, msg.sender, address(this), _price);
    }

    function createMarketSale(uint256 _landID)
        public
        payable
        nonReentrant
        validID(_landID)
    {
        // we find land item price by id from mapping
        uint256 price = IDToLandItem[_landID].price;
        // we find land seller by id from mapping
        address seller = IDToLandItem[_landID].seller;

        // require msg value == land item price
        require(msg.value == price, "submit the asking price");

        // change land item owner to msg.sender / buyer
        IDToLandItem[_landID].owner.push(payable(msg.sender));

        // change land item sold to true
        IDToLandItem[_landID].sold = true;

        // change land item seller to address 0
        IDToLandItem[_landID].seller = payable(address(0));

        // transfer land item from marketplace to msg sender / buyer
        _transfer(address(this), msg.sender, _landID);

        // transfer msg value / price of land item to seller of item
        payable(seller).transfer(msg.value);

        emit LandItemBought(_landID, price, seller, msg.sender);
    }

    /* allows someone to resell a token they have purchased */
    function resellToken(uint256 _landID, uint256 _price) public payable {
        require(
            IERC721(address(this)).ownerOf(_landID) == msg.sender,
            "Only item owner can perform this operation"
        );

        IDToLandItem[_landID].sold = false;
        IDToLandItem[_landID].price = _price;
        IDToLandItem[_landID].seller = payable(msg.sender);
        IDToLandItem[_landID].owner.push(payable(address(this)));

        _transfer(msg.sender, address(this), _landID);

        emit LandItemCreated(_landID, msg.sender, address(this), _price);
    }

    // /// //////////////////////////////////////////////////////////////////////////////////////////////// GETTERS FUNCTIONS

    // get maximum lands that we can mint
    function getMaximumMintLand() external view returns (uint256) {
        return maxID;
    }

    // get amounts of lands that we minted currently
    function getMintedLands() external view returns (uint256) {
        return landIDTracker.current();
    }

    // get owners of one land by id * history
    function getLandOwners(uint256 _landID)
        external
        view
        validID(_landID)
        returns (address payable[] memory)
    {
        return IDToLandItem[_landID].owner;
    }

    // get all details of # Land NFT item
    function getMintedNFTLandDetails(uint256 _landID)
        external
        view
        validID(_landID)
        returns (
            uint256,
            address payable,
            address payable[] memory,
            uint256,
            bool
        )
    {
        LandItem memory _LandItem = IDToLandItem[_landID];

        uint256 landID = _LandItem.landID;
        address payable seller = _LandItem.seller;
        address payable[] memory owner = _LandItem.owner;
        uint256 price = _LandItem.price;
        bool sold = _LandItem.sold;

        return (landID, seller, owner, price, sold);
    }
}
