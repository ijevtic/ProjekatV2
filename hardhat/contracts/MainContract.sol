// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Import this file to use console.log
import "hardhat/console.sol";


error MainContract__StakerNotFound();

contract MainContract {

    address private immutable i_owner;

    uint constant STAKE_TIME = 30 days;

    struct User {
        uint stakedEther;
        uint startDate;
        bool exists;
    }

    mapping(address => User) public userStakeMapping;

    uint feePool = 0;
    address[] public users; //active users

    constructor(address _owner) public {
        i_owner = _owner;
    }


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
            // uint ethers = reedemAaveTokens();
            // transfer(msg.sender, ethers);
            user.exists = false;
            address[] memory usersArray = users;
            bool found = false;
            for(uint i = 0; i < usersArray.size(); ++i) {
                if(users[i] == msg.sender) {
                    users[i] = users[usersArray.size()-1];
                    users.pop();
                    found = true;
                    break;
                }
            }
            if(found == false) 
                revert MainContract__StakerNotFound();
        } else {
            
        }

        user.stakedEther = 0;
    }


}
