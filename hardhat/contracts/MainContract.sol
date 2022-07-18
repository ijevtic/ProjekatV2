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

    uint256 STAKE_TIME = 2 minutes;
    uint256 constant MULTIPLY = 1e18;

    address[] public users; //active users
    mapping(address => User) public userStakeMapping;

    uint256 totalSum = 0;
    uint256 global_c = MULTIPLY;
    uint256 amountATokens = 0;
    uint256 ukupnaKamata = 0;

    IWETHGateway private constant IWETH_GATEWAY =
        IWETHGateway(0xA61ca04DF33B72b235a8A28CfB535bb7A5271B70);

    address private constant LENDING_POOL =
        0xE0fBa4Fc209b4948668006B2bE61711b7f465bAe;

    ERC20 private constant aWETH_ERC20 =
        ERC20(0x87b1f4cf9BD63f7BBD3eE1aD04E8F52540349347);

    event Transaction(address indexed user, uint256 amount, uint256 newAmount, uint256 oldAmount, string transactionType, uint256 old_c, uint256 new_c);
    event EventTest(uint256 amount);
    event WithdrawInterest(uint256 timestamp);

    modifier onlyOwner() {
        if (i_owner == msg.sender) revert MainContract__AccountNotOwner();
        _;
    }

    constructor() {
        i_owner = msg.sender;
    }

    function stakeEther() public payable {
        console.log('stake ether');
        User storage user = userStakeMapping[msg.sender];
        console.log("user.c", user.c, "stakedEther", user.stakedEther);
        totalSum += msg.value;
        user.startDate = block.timestamp;

        uint256 newAmountATokens = getAWETHAddressBalance();
        uint256 oldAmountATokens = amountATokens;
        console.log(newAmountATokens, oldAmountATokens);
        if(newAmountATokens < oldAmountATokens) {
            newAmountATokens = oldAmountATokens;
        }
        
        ukupnaKamata = ukupnaKamata + (newAmountATokens - oldAmountATokens);


        user.baseEther += msg.value;

        uint256 old_c = global_c;

        if(users.length==0) {
            global_c = MULTIPLY;
            user.c = MULTIPLY;
            console.log("prazna lista");
        }
        else {
            global_c = global_c * newAmountATokens / amountATokens;
            console.log("ovo je global_c", global_c);
        }

        if (user.stakedEther == 0) {
            users.push(msg.sender);
            user.index = users.length - 1;
            user.stakedEther = msg.value;
        } else { //TODO
            user.stakedEther =
                (user.stakedEther * global_c) / user.c + msg.value;
        }

        

        amountATokens = newAmountATokens + msg.value;
        user.c = global_c;

        IWETH_GATEWAY.depositETH{value: msg.value}(
            LENDING_POOL,
            address(this),
            0
        );

        emit Transaction(msg.sender, msg.value, newAmountATokens, oldAmountATokens, "Deposit", old_c, global_c);
    }

    function extractEther() public {
        User storage user = userStakeMapping[msg.sender];

        if (user.stakedEther == 0) revert MainContract__StakerNotFound();

        uint256 newAmountATokens = getAWETHAddressBalance();
        uint256 oldAmountATokens = amountATokens;

        uint256 novaKamata = global_c * newAmountATokens * user.stakedEther/ amountATokens;

        // uint256 userKamata = (novaKamata - user.stakedEther * global_c)/user.c;
        uint256 userKamata = (novaKamata - user.stakedEther * global_c);

        uint256 old_c = global_c;

        console.log("userKamata", userKamata);

        ukupnaKamata += userKamata / user.c;

        // uint256 zaradjenaKamataPool = (newAmountATokens - amountATokens) - userKamata;
        uint256 zaradjenaKamataPool = (newAmountATokens - amountATokens) * user.c - userKamata;

        // uint256 poolStaro = amountATokens - (user.stakedEther * global_c)/user.c;
        uint256 poolStaro = amountATokens * user.c - (user.stakedEther * global_c);

        uint256 percentage = MULTIPLY;
        if(STAKE_TIME > 0) {
            percentage = ((block.timestamp - user.startDate) * MULTIPLY) /
                STAKE_TIME /
                2 +
                MULTIPLY /
                2;
        }
        
        console.log("percentage", percentage);
        uint256 withdrawAmount = novaKamata;
        uint256 smanjenje = 0;
        if (percentage < MULTIPLY) {
            // smanjenje = user.baseEther*(MULTIPLY - percentage) / MULTIPLY;
            smanjenje = user.c * user.baseEther*(MULTIPLY - percentage) / MULTIPLY;
        }
        console.log("smanjenje", smanjenje);
        withdrawAmount = withdrawAmount - smanjenje;

        uint256 poolNovo = poolStaro + zaradjenaKamataPool + smanjenje;

        if(poolStaro == 0)
            global_c = MULTIPLY;
        else
            global_c = global_c * poolNovo / poolStaro;

        withdrawAmount = withdrawAmount / user.c; // dodao kasnije, potencijalno za brisanje

        aWETH_ERC20.approve(address(IWETH_GATEWAY), withdrawAmount);
        
        //zasto je pre skidanja 1 a kad se skine 0
        
        // console.log("pre skidanja", newAmountATokens-withdrawAmount);
        IWETH_GATEWAY.withdrawETH(LENDING_POOL, withdrawAmount, address(this));
        // pay the user
        (bool sent, ) = payable(msg.sender).call{
            value: withdrawAmount
        }("");
        if (sent == false) revert();

        amountATokens = newAmountATokens - withdrawAmount;

        console.log('ovoliko je ostalo posle skidanja',amountATokens, newAmountATokens);
        // erase the user
        delete userStakeMapping[msg.sender];
        
        // push last user to the current user position
        address lastUser = users[users.length - 1];
        users[user.index] = lastUser;
        userStakeMapping[lastUser].index = user.index;
        users.pop();

        emit Transaction(msg.sender, withdrawAmount, newAmountATokens, oldAmountATokens, "Withdraw", old_c, global_c);

    }

    function getAWETHAddressBalance() public view returns (uint256) {
        return aWETH_ERC20.balanceOf(address(this));
    }

    function getAccumulatedInterestRate() public view returns (uint256) {
        return getAWETHAddressBalance() - totalSum;
    }

    function ownerWithdraw() public onlyOwner {
        uint256 newAmountATokens = getAWETHAddressBalance();
        ukupnaKamata = ukupnaKamata + (newAmountATokens - amountATokens);

        aWETH_ERC20.approve(address(IWETH_GATEWAY), ukupnaKamata);
        IWETH_GATEWAY.withdrawETH(
            LENDING_POOL,
            ukupnaKamata,
            address(this)
        );
        amountATokens = newAmountATokens - ukupnaKamata;
        ukupnaKamata = 0;
        emit WithdrawInterest(block.timestamp);
    }

    function balanceOfUser()
        public
        view
        returns (uint256 amount)
    {
        User memory user = userStakeMapping[msg.sender];
        uint256 newAmountATokens = getAWETHAddressBalance();
        amount = (user.stakedEther * global_c * newAmountATokens) / amountATokens;
        amount = amount / user.c;
        console.log(amount);
    }

    function realBalanceOfUser()
        public
        view
        returns (uint256 withdrawAmount)
    {
        User memory user = userStakeMapping[msg.sender];
        uint256 newAmountATokens = getAWETHAddressBalance();
        withdrawAmount = (user.stakedEther * global_c * newAmountATokens) / amountATokens;
        withdrawAmount = withdrawAmount / user.c;
        uint256 percentage = MULTIPLY;
        if(STAKE_TIME > 0) {
            percentage = ((block.timestamp - user.startDate) * MULTIPLY) /
                STAKE_TIME /
                2 +
                MULTIPLY /
                2;
        }
        uint256 smanjenje = 0;
        if (percentage < MULTIPLY) {
            // smanjenje = user.baseEther*(MULTIPLY - percentage) / MULTIPLY;
            smanjenje = user.baseEther*(MULTIPLY - percentage) / MULTIPLY;
        }
        withdrawAmount -= smanjenje;
    }

    receive() external payable {}
}
