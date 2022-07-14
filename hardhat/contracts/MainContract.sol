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
        uint256 startDate;
        uint256 index;
        uint256 c;
        uint256 k;
        uint256 previousSumK;
    }

    address private immutable i_owner;

    uint256 constant STAKE_TIME = 30 days;
    uint256 constant MULTIPLY = 100000;

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

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amountBase, uint256 amountProfit);
    event EventTest(uint256 amount);

    modifier onlyOwner() {
        if (i_owner == msg.sender) revert MainContract__AccountNotOwner();
        _;
    }

    constructor(uint256 dusanemajmune) {
        i_owner = msg.sender;
    }

    function stakeEther() public payable {
        User storage user = userStakeMapping[msg.sender];
        totalSum += msg.value;
        user.startDate = block.timestamp;

        uint256 newAmountATokens = getAWETHAddressBalance();

        uint diff = newAmountATokens - amountATokens;

        if (amountATokens == 0) global_k = MULTIPLY;
        else {
            global_k =
                (global_k * (MULTIPLY + (diff * MULTIPLY) / amountATokens)) /
                MULTIPLY;
        }
        amountATokens = newAmountATokens + msg.value;

        if (user.stakedEther == 0) {
            users.push(msg.sender);
            user.index = users.length - 1;
        } else {
            user.previousSumK += user.stakedEther * global_c * global_k / user.c / user.k - user.stakedEther * global_c / user.c;
            user.stakedEther = user.stakedEther * global_c / userStakeMapping[msg.sender].c + msg.value;
        }

        user.c = global_c;
        user.k = global_k;

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

        uint diff = newAmountATokens - amountATokens;
        global_k =
            (global_k * (MULTIPLY + (diff * MULTIPLY) / amountATokens)) /
            MULTIPLY;

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

        uint256 uk = (user.stakedEther * global_c * global_k) / user.c / user.k;
        uint256 profit = uk - ((user.stakedEther * global_c) / user.c) + user.previousSumK;

        uint256 withdrawAmount = (user.stakedEther * global_c) / user.c;
        uint256 remaining = 0;
        if (percentage < MULTIPLY) {
            // uzmi procentualno
            withdrawAmount = (withdrawAmount * percentage) / MULTIPLY;
            remaining = (user.stakedEther * global_c) / user.c - withdrawAmount;
        }

        uint256 lastTotalSum = totalSum;
        uint256 divide = totalSum - (user.stakedEther * global_c) / user.c;

        totalSum -= withdrawAmount;
        if (divide == 0) {
            global_c = MULTIPLY;
        } else {
            global_c =
                (global_c * (MULTIPLY + (remaining * MULTIPLY) / divide)) /
                MULTIPLY;
        }
        //console.log(divide);
        // approve IWETH_GATEWAY to burn aWETH tokens
        aWETH_ERC20.approve(address(IWETH_GATEWAY), withdrawAmount);
        // trade aWETH tokens for ETH
        IWETH_GATEWAY.withdrawETH(LENDING_POOL, withdrawAmount, address(this));

        // pay the user
        (bool sent, ) = payable(msg.sender).call{
            value: withdrawAmount + profit
        }("");
        if (sent == false) revert();

        amountATokens -= (withdrawAmount + profit);
        user.previousSumK = 0;

        // erase the user
        delete userStakeMapping[msg.sender];
        emit Withdraw(msg.sender, withdrawAmount, profit);
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

    function balanceOfUser() public view returns (uint256) {
        console.log(
            (userStakeMapping[msg.sender].stakedEther * global_c) /
                userStakeMapping[msg.sender].c
        );
        console.log(global_c);
        console.log(userStakeMapping[msg.sender].c);
        return
            (userStakeMapping[msg.sender].stakedEther * global_c) /
            userStakeMapping[msg.sender].c;
    }

    function test(uint vr) public view returns(uint) {
        return vr+1;
    }

    function testEvent(uint vr) public {
        emit EventTest(vr);
    }

    receive() external payable {}
}
