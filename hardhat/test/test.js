const hre = require('hardhat');

describe('Yearn-view', function () {
    this.timeout(80000);

    let senderAcc;
    let yearnRegistry;
    let mainContractObj;

    before(async () => {
        const MainContract = await hre.ethers.getContractFactory("MainContract");
        mainContractObj = await MainContract.deploy();
 
        senderAcc1 = (await hre.ethers.getSigners())[0];
         
        //senderAcc2 = (await hre.ethers.getSigners())[1];
    });

    it('... should get pool liquidity', async () => {

        await mainContractObj.stakeEther({value: 1e18});
        // await mainContractObj.extractEther();
    });
});