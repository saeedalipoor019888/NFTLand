const hre = require("hardhat");

async function main() {
  const VWorld = await hre.ethers.getContractFactory("VWorld");
  const VWorldContract = await VWorld.deploy();
  await VWorldContract.deployed();

  console.log("VWorldContract deployed to:", VWorldContract.address);

  const uriArray = [
    [1, 2, 3],
    [5, 4, 7],
    [9, 10, 11],
  ];

  for (let i = 0; i < uriArray.length; i++) {
    const URI = uriArray[i].toString();

    // deployer mint nft
    await VWorldContract.mintLand(URI);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
