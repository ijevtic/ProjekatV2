const hre = require('hardhat');
const { assert } = require("chai");
const delay = ms => new Promise(res => setTimeout(res, ms));

describe('Yearn-view', function () {
    this.timeout(80000);

    const senderAccounts = [];
    let yearnRegistry;
    let mainContractObj;

    before(async () => {
        const MainContract = await hre.ethers.getContractFactory("MainContract");
        mainContractObj = await MainContract.deploy();
 
        senderAccounts.push((await hre.ethers.getSigners())[0]);
        senderAccounts.push((await hre.ethers.getSigners())[1]);
        senderAccounts.push((await hre.ethers.getSigners())[2]);
        senderAccounts.push((await hre.ethers.getSigners())[3]);
        senderAccounts.push((await hre.ethers.getSigners())[4]);
    });

    it('... should get pool liquidity', async () => {

        for(let i =0; i < 5; i++) {

            await mainContractObj.connect(senderAccounts[0]).stakeEther({value: ethers.utils.parseEther("0.005")});
            await mainContractObj.connect(senderAccounts[0]).extractEther();
            // await mainContractObj.connect(senderAccounts[0]).stakeEther({value: ethers.utils.parseEther("0.005")});
            // await mainContractObj.connect(senderAccounts[1]).stakeEther({value: ethers.utils.parseEther("0.01")});
            // await mainContractObj.connect(senderAccounts[2]).stakeEther({value: ethers.utils.parseEther("0.005")});

            // await mainContractObj.connect(senderAccounts[1]).extractEther();
            // await mainContractObj.connect(senderAccounts[0]).stakeEther({value: ethers.utils.parseEther("0.005")});
            // await mainContractObj.connect(senderAccounts[2]).extractEther();

            // await delay(3000);
            // await mainContractObj.connect(senderAccounts[0]).extractEther();

            // await mainContractObj.connect(senderAccounts[0]).balanceOfContractATokens();
        }
        // for(let i = 0; i < 10; i++) {
        //     await mainContractObj.connect(senderAccounts[0]).stakeEther({value: ethers.utils.parseEther("10")});
        //     await delay(1500);
        //     await mainContractObj.connect(senderAccounts[0]).extractEther();

        // }
    });
});