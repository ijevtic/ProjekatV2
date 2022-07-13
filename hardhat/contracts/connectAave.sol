pragma solidity >=0.8.0;

import "./IWETHGateway.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Connect {
    IWETHGateway private constant IWETH_AAVE =
        IWETHGateway(0xA61ca04DF33B72b235a8A28CfB535bb7A5271B70);

    address private constant LENDING_POOL =
        0xE0fBa4Fc209b4948668006B2bE61711b7f465bAe;

    ERC20 private constant aWETH_ERC20 =
        ERC20(0x87b1f4cf9BD63f7BBD3eE1aD04E8F52540349347);

    function deposit() public payable {
        IWETH_AAVE.depositETH{value: msg.value}(LENDING_POOL, address(this), 0);
    }

    function withdraw() public {
        aWETH_ERC20.approve(address(IWETH_AAVE), type(uint256).max);
        IWETH_AAVE.withdrawETH(LENDING_POOL, type(uint256).max, address(this));
    }

    receive() external payable {}
}
