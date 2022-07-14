const hre = require('hardhat');

describe('Yearn-view', function () {
    this.timeout(80000);

    let senderAcc;
    let yearnRegistry;
    let mainContractObj;

    before(async () => {
        const MainContract = await hre.ethers.getContractFactory("MainContract");
        mainContractObj = await MainContract.deploy();
 
        senderAcc = (await hre.ethers.getSigners())[0];
    });

    it('... should get pool liquidity', async () => {

        await mainContractObj.stakeEther({value: 100000000});
        await mainContractObj.extractEther();
    });
});