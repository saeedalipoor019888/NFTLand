//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract VWorld is ERC721URIStorage, Ownable {
    // using counter to set dedicated id per any land
    using Counters for Counters.Counter;
    Counters.Counter public landIDTracker;

    // maximum lands that we can mint
    uint256 maxID = 10;

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

    // using mapping to track history of owners for any land
    mapping(uint256 => address[]) landOwners;

    // market struct for land item
    // we can add owner history as array in this struct
    struct LandItem {
        uint256 landID;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }
    mapping(uint256 => LandItem) private IDToLandItem;

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

        //push msg sender as owner to item owners array
        landOwners[_landID].push(msg.sender);

        // list land item to sell directly after mint
        createMarketItem(_landID, 1 ether);
    }

    function createMarketItem(uint256 _landID, uint256 _price) private {
        // we check listing price is more than 0
        require(_price > 0, "Price must be at least 1 wei");

        // we add land item to mapping by id
        IDToLandItem[_landID] = LandItem(
            _landID,
            payable(msg.sender),
            payable(address(this)),
            _price,
            false
        );

        // we transfer land item ownership from msg sender to marketplace
        _transfer(msg.sender, address(this), _landID);

        emit LandItemCreated(_landID, msg.sender, address(this), _price);
    }

    function createMarketSale(uint256 _landID) public payable {
        // we find land item price by id from mapping
        uint256 price = IDToLandItem[_landID].price;
        // we find land seller by id from mapping
        address seller = IDToLandItem[_landID].seller;

        // require msg value == land item price
        require(msg.value == price, "submit the asking price");

        // change land item owner to msg.sender / buyer
        IDToLandItem[_landID].owner = payable(msg.sender);

        //push msg sender as owner to item owners array
        landOwners[_landID].push(msg.sender);

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
        returns (address[] memory)
    {
        return landOwners[_landID];
    }
}
