require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");

module.exports = {
  defaultNetwork: "kovan",
  networks: {
    hardhat: {},
    kovan: {
      url: "https://kovan.infura.io/v3/75fe0c9d66ad48a7ba1e3c5ca2ac94a9",
      accounts: ["3d252d8dc083bef59f664faae8ff7dcc045a7f15414409498a96a03e756a38fc"],
      blockConfirmations: 2,
    },
    local: {
      url: "http://127.0.0.1:8545",
    }
  },
  etherscan: {
    apiKey: "AATX7VW3FQPQ5YQ95T83IKC1C5KYXV73AI",
  },
  solidity: "0.8.9",
};
