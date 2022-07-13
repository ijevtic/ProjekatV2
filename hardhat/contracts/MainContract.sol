// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Import this file to use console.log
import "hardhat/console.sol";


error MainContract__StakerNotFound();

contract MainContract {

    address private immutable i_owner;

    uint constant STAKE_TIME = 30 days;
    uint constant MULTIPLY = 100000;

    struct User {
        uint stakedEther;
        uint startDate;
        uint index;
        bool exists;
    }

    mapping(address => User) public userStakeMapping;

    uint totalSum = 0;
    address[] public users; //active users

    constructor() {
        i_owner = msg.sender;
    }


    function stakeEther() public payable {
        User storage user = userStakeMapping[msg.sender];
        user.stakedEther += msg.value;
        totalSum += msg.value;
        user.startDate = block.timestamp;

        if(!user.exists) {
            user.exists = true;
            users.push(msg.sender);
            user.index = users.length-1;
        }
    }


    function extractEther() public {
        User storage user = userStakeMapping[msg.sender];
        
        uint index = user.index;
        if(index >= users.length || !user.exists)
            revert MainContract__StakerNotFound();
        
        user.exists = false;
        users[index] = users[users.length-1];
        users.pop();

        totalSum -= user.stakedEther;
        uint percentage = (block.timestamp - user.startDate) * MULTIPLY / STAKE_TIME / 2;
        uint withdrawAmount = user.stakedEther;
        if(percentage * 2 < MULTIPLY) {
            // uzmi procentualno
            withdrawAmount = withdrawAmount * percentage / MULTIPLY;
            uint remaining = user.stakedEther - withdrawAmount;
            for(uint i = 0; i < users.length; i++) {
                uint base = userStakeMapping[users[i]].stakedEther;
                uint add = base * remaining / totalSum;
                userStakeMapping[users[i]].stakedEther += add;
            } 
        }
        // ethers = redeemAaveTokens(withdrawAmount);
        // transfer(msg.sender, ethers);
        user.stakedEther = 0;
    }

    function ownerWithdraw() public {
        require(i_owner == msg.sender);
    }


}
