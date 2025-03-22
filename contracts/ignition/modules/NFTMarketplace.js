const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { ethers } = require('hardhat');

module.exports = buildModule('NFTMarketplaceModule', (m) => {
  const initialOwner = m.getParameter('initialOwner', m.getAccount(0));

  const marketplaceFeePercentage = m.getParameter(
    'marketplaceFeePercentage',
    250
  );

  const mintFee = m.getParameter('mintFee', ethers.parseEther('0.01'));

  const nftMarketplace = m.contract('NFTMarketplace', [initialOwner]);

  const setMarketplaceFee = m.call(
    nftMarketplace,
    'setMarketplaceFee',
    [marketplaceFeePercentage],
    {
      id: 'configureSetMarketplaceFee',
    }
  );

  const setMintFee = m.call(nftMarketplace, 'setMintFee', [mintFee], {
    id: 'configureSetMintFee',
  });

  return { nftMarketplace, setMarketplaceFee, setMintFee };
});
