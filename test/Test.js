const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VWorld", function () {
  let VWorldContract;
  let deployer;
  let addr1;
  const simpleURI = "sample URI";

  beforeEach(async () => {
    [deployer, addr1] = await ethers.getSigners();

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

  describe("Minting 3 NFT and list it to market by deployer ! we use details of X , Y Area", () => {
    it("Should track minted NFTs", async () => {
      const uriArray = [
        [1, 2, 3],
        [5, 4, 7],
        [9, 10, 11],
      ];

      for (let i = 0; i < uriArray.length; i++) {
        const URI = uriArray[i].toString();

        // deployer mint nft
        await VWorldContract.mintLand(URI);

        // land id will increase by 1
        expect(await VWorldContract.getMintedLands()).to.equal(i + 1);

        // balance of deployer after mint land is 0 because of we listed land item to sell and owner is market !
        expect(await VWorldContract.balanceOf(deployer.address)).to.equal(0);
        // every time we mint new nft , market balance will increase by one
        expect(await VWorldContract.balanceOf(VWorldContract.address)).to.equal(
          i + 1
        );

        // check token uri of nft item
        const landURI = (await VWorldContract.tokenURI(i + 1)).split(",");

        // now we check x,y and area by Number(index) from landURI
        expect(Number(landURI[0])).to.equal(uriArray[i][0]);
        expect(Number(landURI[1])).to.equal(uriArray[i][1]);
        expect(Number(landURI[2])).to.equal(uriArray[i][2]);
      }
    });
  });

  describe("buy NFT land by addr1, first test with 1 land, and we can owners history", () => {
    beforeEach(async () => {
      // mint and list 1 NFT by deployer in marketplace
      await VWorldContract.mintLand(simpleURI);
    });

    it("addr1 can buy land #1 and in history array we can see deployer addr and addr1 as owners", async () => {
      // here we bought land #1 and listen to LandItemBought event with arguments land id, land price, seller address and buyer address
      await expect(
        VWorldContract.connect(addr1).createMarketSale(1, {
          value: ethers.utils.parseEther("1"),
        })
      )
        .to.emit(VWorldContract, "LandItemBought")
        .withArgs(
          1,
          ethers.utils.parseEther("1"),
          deployer.address,
          addr1.address
        );

      // now check NFT land #1
      const landItem = await VWorldContract.getMintedNFTLandDetails(1);
      // check item id #1
      expect(landItem[0]).to.equal(1);
      // check seller to 0
      expect(landItem[1]).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
      // check owner array length to 2 index !
      expect(landItem[2].length).to.equal(2);
      // check owners index 0 to marketplace address
      expect(landItem[2][0]).to.equal(VWorldContract.address);
      // check owners index 1 to addr 1 address
      expect(landItem[2][1]).to.equal(addr1.address);
      // check item price to 1 ether
      expect(landItem[3]).to.equal(ethers.utils.parseEther("1"));

      // Now we can check ownership history of lands #1
      expect(await VWorldContract.ownerOf(1)).to.equal(addr1.address);

      // get array of owners for land 1
      const ownershipHistoryArray = await VWorldContract.getLandOwners(1);
      // owner 1 is deployer address because of in mintLand function we pushed deployer address as first owner
      expect(ownershipHistoryArray[0]).to.equal(VWorldContract.address);
      // owner 2 is addr1 address
      expect(ownershipHistoryArray[1]).to.equal(addr1.address);
    });
  });

  describe("buy NFT land by addr1, and again list it for sell in marketplace", () => {
    beforeEach(async () => {
      // mint and list 1 NFT by deployer in marketplace
      await VWorldContract.mintLand(simpleURI);

      // buy minted land by addr 1
      await VWorldContract.connect(addr1).createMarketSale(1, {
        value: ethers.utils.parseEther("1"),
      });
    });

    it("addr1 now list item again for sale in marketplace", async () => {
      await expect(
        VWorldContract.connect(addr1).resellToken(
          1,
          ethers.utils.parseEther("1")
        )
      )
        .to.emit(VWorldContract, "LandItemCreated")
        .withArgs(
          1,
          addr1.address,
          VWorldContract.address,
          ethers.utils.parseEther("1")
        );

      // now check NFT land #1
      const landItem = await VWorldContract.getMintedNFTLandDetails(1);

      // check item id #1
      expect(landItem[0]).to.equal(1);
      // check seller to addr 1
      expect(landItem[1]).to.equal(addr1.address);
      // check owner array length to 3 index !
      expect(landItem[2].length).to.equal(3);
      // check owners index 0 to marketplace address
      expect(landItem[2][0]).to.equal(VWorldContract.address);
      // check owners index 1 to addr 1 address
      expect(landItem[2][1]).to.equal(addr1.address);
      // check owners index 2 to marketplace address because we list item for sell again
      expect(landItem[2][2]).to.equal(VWorldContract.address);
      // check item price to 1 ether
      expect(landItem[3]).to.equal(ethers.utils.parseEther("1"));
    });
  });

  describe("in this section we want test cases that user will get revert, we use details of X , Y Area", () => {
    beforeEach(async () => {
      // in contract we set maximum NFT to mint for 3 items , here we mint 3 items before anything ! and ONLY deployer can mint !
      const uriArray = [
        [1, 2, 3],
        [5, 4, 7],
        [9, 10, 11],
      ];

      for (let i = 0; i < uriArray.length; i++) {
        const URI = uriArray[i].toString();

        // deployer ! mint nft
        await VWorldContract.mintLand(URI);

        // land id will increase by 1
        expect(await VWorldContract.getMintedLands()).to.equal(i + 1);

        // balance of deployer after mint land is 0 because of we listed land item to sell and owner is market !
        expect(await VWorldContract.balanceOf(deployer.address)).to.equal(0);
        // every time we mint new nft , market balance will increase by one
        expect(await VWorldContract.balanceOf(VWorldContract.address)).to.equal(
          i + 1
        );

        // check token uri of nft item
        const landURI = (await VWorldContract.tokenURI(i + 1)).split(",");

        // now we check x,y and area by Number(index) from landURI
        expect(Number(landURI[0])).to.equal(uriArray[i][0]);
        expect(Number(landURI[1])).to.equal(uriArray[i][1]);
        expect(Number(landURI[2])).to.equal(uriArray[i][2]);
      }
    });

    it("we will get error because addr1 want mint nft ! only deployer can mint nft", async () => {
      await expect(
        VWorldContract.connect(addr1).mintLand(simpleURI)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("we will get error because we want mint more than allowed nft to mint ! we can't mint more than 3 items", async () => {
      await expect(VWorldContract.mintLand(simpleURI)).to.be.revertedWith(
        "you can't mint more land !, maxID is reached !"
      );
    });

    it("addr1 try to buy land item for 0.1 ether and will get error because of price is 1 ehter", async () => {
      await expect(
        VWorldContract.connect(addr1).createMarketSale(1, {
          value: ethers.utils.parseEther("0.1"),
        })
      ).to.be.revertedWith("submit the asking price");
    });

    it("addr1 try to buy land item with invalid item id!", async () => {
      await expect(
        VWorldContract.connect(addr1).createMarketSale(4, {
          value: ethers.utils.parseEther("1"),
        })
      ).to.be.revertedWith("invalid land item id");
    });
  });
});
