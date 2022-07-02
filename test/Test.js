const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VWorld", function () {
  let VWorldContract;
  let deployer;
  let addr1;
  let addr2;
  let addr3;
  const URI = "sample URI";

  beforeEach(async () => {
    [deployer, addr1, addr2, addr3] = await ethers.getSigners();

    const VWorld = await ethers.getContractFactory("VWorld");
    VWorldContract = await VWorld.deploy();
    await VWorldContract.deployed();
  });

  describe("Deployment", () => {
    it("Should track name and symbol of the nft collection", async () => {
      const nftName = "VWorld";
      const nftSymbol = "VW";
      expect(await VWorldContract.name()).to.equal(nftName);
      expect(await VWorldContract.symbol()).to.equal(nftSymbol);
    });
  });

  describe("Minting 1 NFT and list it to market by deployer !", () => {
    it("Should track minted NFT", async () => {
      // create land URI by javascript
      const x = 1;
      const y = 2;
      const area = 3;

      // create empty array and push x,y and area and then convert it to string and use it as land uri
      const URIArray = [];
      URIArray.push(x);
      URIArray.push(y);
      URIArray.push(area);
      const URI = URIArray.toString();

      // addr1 mint 1 nft
      await VWorldContract.mintLand(URI);
      // land id will increase to 1
      expect(await VWorldContract.getMintedLands()).to.equal(1);

      // balance of deployer after mint land is 0 because of we listed land item to sell and owner is market !
      expect(await VWorldContract.balanceOf(deployer.address)).to.equal(0);
      expect(await VWorldContract.balanceOf(VWorldContract.address)).to.equal(
        1
      );

      // check token uri of nft item 1
      // first we get token uri and convert it to array by split function in javascript
      const landURI = (await VWorldContract.tokenURI(1)).split(",");

      // now we check x,y and area by Number(index) from landURI
      expect(Number(landURI[0])).to.equal(x);
      expect(Number(landURI[1])).to.equal(y);
      expect(Number(landURI[2])).to.equal(area);
    });
  });

  // describe("Minting 3 NFT and list it to market by deployer !", () => {
  //   it("Should track minted NFTs", async () => {
  //     const uriArray = [
  //       [1, 2, 3],
  //       [5, 4, 7],
  //       [9, 10, 11],
  //     ];

  //     for (let i = 0; i < uriArray.length; i++) {
  //       const URI = uriArray[i].toString();

  //       // addr1 mint nft
  //       await VWorldContract.mintLand(URI);

  //       // land id will increase by 1
  //       expect(await VWorldContract.getMintedLands()).to.equal(i + 1);

  //       // balance of deployer after mint land is 0 because of we listed land item to sell and owner is market !
  //       expect(await VWorldContract.balanceOf(deployer.address)).to.equal(0);
  //       // every time we mint new nft , market balance will increase by one
  //       expect(await VWorldContract.balanceOf(VWorldContract.address)).to.equal(
  //         i + 1
  //       );

  //       // check token uri of nft item
  //       const landURI = (await VWorldContract.tokenURI(i + 1)).split(",");

  //       // now we check x,y and area by Number(index) from landURI
  //       expect(Number(landURI[0])).to.equal(uriArray[i][0]);
  //       expect(Number(landURI[1])).to.equal(uriArray[i][1]);
  //       expect(Number(landURI[2])).to.equal(uriArray[i][2]);
  //     }
  //   });
  // });

  // describe("buy NFT land by addr1, first test with 1 land, and we can owners history", () => {
  //   beforeEach(async () => {
  //     // mint and list 1 NFT by deployer in marketplace
  //     await VWorldContract.mintLand(URI);
  //   });

  //   it("addr1 can buy land #1 and in history array we can see deployer addr and addr1 as owners", async () => {
  //     // here we bought land #1 and listen to LandItemBought event with arguments land id, land price, seller address and buyer address
  //     await expect(
  //       VWorldContract.connect(addr1).createMarketSale(1, {
  //         value: ethers.utils.parseEther("1"),
  //       })
  //     )
  //       .to.emit(VWorldContract, "LandItemBought")
  //       .withArgs(
  //         1,
  //         ethers.utils.parseEther("1"),
  //         deployer.address,
  //         addr1.address
  //       );

  //     // Now we can check ownership history of lands #1
  //     expect(await VWorldContract.ownerOf(1)).to.equal(addr1.address);

  //     // get array of owners for land 1
  //     const ownershipHistoryArray = await VWorldContract.getLandOwners(1);
  //     // owner 1 is deployer address because of in mintLand function we pushed deployer address as first owner
  //     expect(ownershipHistoryArray[0]).to.equal(deployer.address);
  //     // owner 2 is addr1 address
  //     expect(ownershipHistoryArray[1]).to.equal(addr1.address);
  //   });
  // });
});
