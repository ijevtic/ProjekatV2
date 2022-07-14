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
    }

    address[] public users; //active users
    mapping(address => User) public userStakeMapping;

    uint256 totalSum = 0;

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

        uint256 index = user.index;

        // push last user to the current user position
        address lastUser = users[users.length - 1];
        users[index] = lastUser;
        userStakeMapping[lastUser].index = index;
        users.pop();

        totalSum -= user.stakedEther;
        uint256 percentage = ((block.timestamp - user.startDate) * MULTIPLY) /
            STAKE_TIME /
            2 +
            MULTIPLY /
            2;

        uint256 withdrawAmount = user.stakedEther;

        if (percentage < MULTIPLY) {
            // uzmi procentualno
            withdrawAmount = (withdrawAmount * percentage) / MULTIPLY;
            uint256 remaining = user.stakedEther - withdrawAmount;
            for (uint256 i = 0; i < users.length; i++) {
                uint256 base = userStakeMapping[users[i]].stakedEther;
                uint256 add = (base * remaining) / totalSum;
                userStakeMapping[users[i]].stakedEther += add;
            }
        }

        // approve IWETH_GATEWAY to burn aWETH tokens
        aWETH_ERC20.approve(address(IWETH_GATEWAY), withdrawAmount);
        // trade aWETH tokens for ETH
        IWETH_GATEWAY.withdrawETH(LENDING_POOL, withdrawAmount, address(this));

        // pay the user
        (bool sent, bytes memory data) = payable(msg.sender).call{
            value: withdrawAmount
        }("");

        // erase the user
        delete userStakeMapping[msg.sender];
    }

    function getAWETHAddressBalance() private returns (uint256) {
        return aWETH_ERC20.balanceOf(address(this));
    }

    function ownerWithdraw() public onlyOwner {}

    receive() external payable {}
}
