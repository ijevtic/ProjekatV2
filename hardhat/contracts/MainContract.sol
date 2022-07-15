// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "./IWETHGateway.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

error MainContract__StakerNotFound();
error MainContract__AccountNotOwner();

contract MainContract {
    struct User {
        uint256 stakedEther;
        uint256 baseEther;
        uint256 startDate;
        uint256 index;
        uint256 c;
    }

    address private immutable i_owner;

    uint256 constant STAKE_TIME = 30 days;
    uint256 constant MULTIPLY = 100000;

    address[] public users; //active users
    mapping(address => User) public userStakeMapping;

    uint256 totalSum = 0;
    uint256 global_c = MULTIPLY;
    uint256 amountATokens = 0;

    IWETHGateway private constant IWETH_GATEWAY =
        IWETHGateway(0xA61ca04DF33B72b235a8A28CfB535bb7A5271B70);

    address private constant LENDING_POOL =
        0xE0fBa4Fc209b4948668006B2bE61711b7f465bAe;

    ERC20 private constant aWETH_ERC20 =
        ERC20(0x87b1f4cf9BD63f7BBD3eE1aD04E8F52540349347);

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(
        address indexed user,
        uint256 amount
    );
    event EventTest(uint256 amount);

    modifier onlyOwner() {
        if (i_owner == msg.sender) revert MainContract__AccountNotOwner();
        _;
    }

    constructor() {
        i_owner = msg.sender;
    }

    function stakeEther() public payable {
        User storage user = userStakeMapping[msg.sender];
        totalSum += msg.value;
        user.startDate = block.timestamp;

        uint256 newAmountATokens = getAWETHAddressBalance();

        amountATokens = newAmountATokens + msg.value;

        user.baseEther += msg.value;

        if (user.stakedEther == 0) {
            users.push(msg.sender);
            user.index = users.length - 1;
            user.stakedEther = msg.value;
        } else { //TODO
            user.stakedEther =
                (user.stakedEther * global_c) / user.c + msg.value;
        }

        global_c = global_c * newAmountATokens / amountATokens;

        user.c = global_c;

        IWETH_GATEWAY.depositETH{value: msg.value}(
            LENDING_POOL,
            address(this),
            0
        );

        emit Deposit(msg.sender, user.stakedEther);
    }

    function extractEther() public {
        User storage user = userStakeMapping[msg.sender];

        if (user.stakedEther == 0) revert MainContract__StakerNotFound();

        uint256 newAmountATokens = getAWETHAddressBalance();

        uint256 novaKamata = global_c * newAmountATokens / amountATokens;

        uint256 maxPovuce = user.stakedEther * novaKamata / user.c;

        uint256 zaradjenaKamataPool = (newAmountATokens - amountATokens) - (user.stakedEther * novaKamata - user.stakedEther * global_c)/user.c;

        uint256 poolStaro = amountATokens - (user.stakedEther * global_c)/user.c;

        amountATokens = newAmountATokens;

        uint256 index = user.index;

        // push last user to the current user position
        address lastUser = users[users.length - 1];
        users[index] = lastUser;
        userStakeMapping[lastUser].index = index;
        users.pop();

        uint256 percentage = ((block.timestamp - user.startDate) * MULTIPLY) /
            STAKE_TIME /
            2 +
            MULTIPLY /
            2;

        uint256 withdrawAmount = maxPovuce;
        uint256 smanjenje = 0;
        if (percentage < MULTIPLY) {
            smanjenje = user.baseEther*(MULTIPLY - percentage) / MULTIPLY;
        }

        withdrawAmount = withdrawAmount - smanjenje;

        uint256 poolNovo = poolStaro + zaradjenaKamataPool + smanjenje;

        global_c = global_c * poolNovo / poolStaro;

        // approve IWETH_GATEWAY to burn aWETH tokens
        aWETH_ERC20.approve(address(IWETH_GATEWAY), withdrawAmount);
        // trade aWETH tokens for ETH
        IWETH_GATEWAY.withdrawETH(LENDING_POOL, withdrawAmount, address(this));

        // pay the user
        (bool sent, ) = payable(msg.sender).call{
            value: withdrawAmount
        }("");
        if (sent == false) revert();

        amountATokens = amountATokens - withdrawAmount;

        // erase the user
        delete userStakeMapping[msg.sender];
        emit Withdraw(msg.sender, withdrawAmount);
    }

    function getAWETHAddressBalance() public view returns (uint256) {
        return aWETH_ERC20.balanceOf(address(this));
    }

    function getAccumulatedInterestRate() public view returns (uint256) {
        return getAWETHAddressBalance() - totalSum;
    }

    function ownerWithdraw() public onlyOwner {
        uint256 accumulatedInterestRate = getAWETHAddressBalance() - totalSum;
        aWETH_ERC20.approve(address(IWETH_GATEWAY), accumulatedInterestRate);
        IWETH_GATEWAY.withdrawETH(
            LENDING_POOL,
            accumulatedInterestRate,
            address(this)
        );
    }

    function balanceOfUser()
        public
        view
        returns (uint256 base, uint256 interest)
    {
        User memory user = userStakeMapping[msg.sender];
        uint256 newAmountATokens = getAWETHAddressBalance();
        base = 1;
        interest = 1;
    }

    receive() external payable {}
}
