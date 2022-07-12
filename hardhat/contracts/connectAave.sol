pragma solidity >=0.8.0;

contract Connect {
    function deposit (address _contract, address _asset, uint256 _amount, address _onBehalfOf, uint16 _referralCode) public {
        bool success;
        bytes memory result;
        (success, result) = _contract.call(abi.encodeWithSignature("deposit(address,uint256,address,uint16)", _asset, _amount, _onBehalfOf, _referralCode));
    }

    function withdraw(address _contract, address _asset, uint256 _amount, address _to) public {
        bool success;
        bytes memory result;
        (success, result) = _contract.call(abi.encodeWithSignature("withdraw(address,uint256,address)", _asset, _amount, _to));
    }
}