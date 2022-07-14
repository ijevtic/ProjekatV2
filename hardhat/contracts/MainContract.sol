// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "./IWETHGateway.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

error MainContract__StakerNotFound();
error MainContract__AccountNotOwner();

contract MainContract {
    address private immutable i_owner;

    uint256 constant STAKE_TIME = 30 days;
    uint256 constant MULTIPLY = 100000;


    struct User {
        uint256 stakedEther;
        uint256 startDate;
        uint256 index;
        uint256 c;
        uint256 k;
    }

    address[] public users; //active users
    mapping(address => User) public userStakeMapping;

    uint256 totalSum = 0;
    uint256 global_c = MULTIPLY;
    uint256 global_k = MULTIPLY;
    uint256 amountATokens = 0;

    IWETHGateway private constant IWETH_GATEWAY =
        IWETHGateway(0xA61ca04DF33B72b235a8A28CfB535bb7A5271B70);

    address private constant LENDING_POOL =
        0xE0fBa4Fc209b4948668006B2bE61711b7f465bAe;

    ERC20 private constant aWETH_ERC20 =
        ERC20(0x87b1f4cf9BD63f7BBD3eE1aD04E8F52540349347);

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

        uint256 newAmountATokens; // = aave

        uint diff = newAmountATokens - amountATokens;
        global_k = global_k*(MULTIPLY+diff*MULTIPLY/amountATokens)/MULTIPLY;
        amountATokens = newAmountATokens + msg.value;

        user.c = global_c;
        user.k = global_k;
        if (user.stakedEther == 0) {
            users.push(msg.sender);
            user.index = users.length - 1;
        }

        IWETH_GATEWAY.depositETH{value: msg.value}(
            LENDING_POOL,
            address(this),
            0
        );
        
        user.stakedEther += msg.value;
    }

    function extractEther() public {
        User storage user = userStakeMapping[msg.sender];

        if (user.stakedEther == 0) revert MainContract__StakerNotFound();


        uint256 newAmountATokens; // = aave

        uint diff = newAmountATokens - amountATokens;
        global_k = global_k*(MULTIPLY+diff*MULTIPLY/amountATokens)/MULTIPLY;

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

        uint256 uk = user.stakedEther * global_c * global_k / user.c / user.k;
        uint256 profit = uk - (user.stakedEther * global_c / user.c);

        uint256 withdrawAmount = user.stakedEther * global_c / user.c;
        uint256 remaining = 0;
        if (percentage < MULTIPLY) {
            // uzmi procentualno
            withdrawAmount = (withdrawAmount * percentage) / MULTIPLY;
            remaining = user.stakedEther * global_c / user.c - withdrawAmount;
        }
        uint256 lastTotalSum = totalSum;
        uint256 divide = totalSum - user.stakedEther * global_c / user.c;

        totalSum -= withdrawAmount;
        global_c = global_c * (MULTIPLY + remaining * MULTIPLY /divide)/MULTIPLY;
        // approve IWETH_GATEWAY to burn aWETH tokens
        aWETH_ERC20.approve(address(IWETH_GATEWAY), withdrawAmount);
        // trade aWETH tokens for ETH
        IWETH_GATEWAY.withdrawETH(LENDING_POOL, withdrawAmount, address(this));

        // pay the user
        (bool sent, bytes memory data) = payable(msg.sender).call{
            value: withdrawAmount + profit
        }("");

        amountATokens -= (withdrawAmount + profit);

        // erase the user
        delete userStakeMapping[msg.sender];
    }

    function getAWETHAddressBalance() private returns (uint256) {
        return aWETH_ERC20.balanceOf(address(this));
    }

    function ownerWithdraw() public onlyOwner {}


    function balanceOfUser() public returns(uint256) {
        console.log(userStakeMapping[msg.sender].stakedEther*global_c/userStakeMapping[msg.sender].c);
        console.log(global_c);
        console.log(userStakeMapping[msg.sender].c);
        return userStakeMapping[msg.sender].stakedEther*global_c/userStakeMapping[msg.sender].c;
        
    }

    receive() external payable {}
}
