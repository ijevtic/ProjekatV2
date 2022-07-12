// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Import this file to use console.log
import "hardhat/console.sol";

contract MainContract {

    uint constant STAKE_TIME = 30 days;

    struct User {
        uint stakedEther;
        uint startDate;
        bool exists;
    }

    mapping(address => User) public userStakeMapping;

    uint feePool = 0;
    address[] public users;


    function stakeEther() public payable {
        User storage user = userStakeMapping[msg.sender];
        user.stakedEther += msg.value;
        user.startDate = block.timestamp;
        if(!user.exists) {
            user.exists = true;
            users.push(msg.sender);
        }
    }


    function extractEther() public {
        User storage user = userStakeMapping[msg.sender];
        uint percentage = (block.timestamp - user.startDate)*1000 / STAKE_TIME;
        if(percentage >= 1000) {//uzima sve 

        } else {

        }

        user.stakedEther = 0;
    }


}
