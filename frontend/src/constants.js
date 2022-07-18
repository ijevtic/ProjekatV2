export const contractAddress = "0xb3d646985009Da7229338D027F0b447eC1BE8956";
export const abi = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  { inputs: [], name: "MainContract__AccountNotOwner", type: "error" },
  { inputs: [], name: "MainContract__StakerNotFound", type: "error" },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "EventTest",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "oldAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "transactionType",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "old_c",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "new_c",
        type: "uint256",
      },
    ],
    name: "Transaction",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "WithdrawInterest",
    type: "event",
  },
  {
    inputs: [],
    name: "balanceOfUser",
    outputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "extractEther",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getAWETHAddressBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAccumulatedInterestRate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "ownerWithdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "realBalanceOfUser",
    outputs: [
      { internalType: "uint256", name: "withdrawAmount", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "stakeEther",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "userStakeMapping",
    outputs: [
      { internalType: "uint256", name: "stakedEther", type: "uint256" },
      { internalType: "uint256", name: "baseEther", type: "uint256" },
      { internalType: "uint256", name: "startDate", type: "uint256" },
      { internalType: "uint256", name: "index", type: "uint256" },
      { internalType: "uint256", name: "c", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "users",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  { stateMutability: "payable", type: "receive" },
];
