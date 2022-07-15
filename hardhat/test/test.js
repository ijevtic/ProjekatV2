const hre = require('hardhat');

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

        await mainContractObj.connect(senderAccounts[0]).stakeEther({value: ethers.utils.parseEther("100")});
        await mainContractObj.connect(senderAccounts[1]).stakeEther({value: ethers.utils.parseEther("100")});
        await mainContractObj.connect(senderAccounts[2]).stakeEther({value: ethers.utils.parseEther("200")});
        await mainContractObj.connect(senderAccounts[3]).stakeEther({value: ethers.utils.parseEther("50")});
    });
});