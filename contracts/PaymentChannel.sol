// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
contract PaymentChannel{
    address payable public sender;
    address payable public recipent;
    uint public expiration;

    event Deployed(uint expire);
    event TimeExtended(uint Time);

    constructor (address payable _recipent , uint _expiration) payable{
        sender = payable(msg.sender);
        recipent = payable(_recipent);
        expiration = _expiration;
        emit Deployed(expiration);
    }

    function close(uint amount , bytes memory sign) public {
        require(msg.sender == recipent,'Require Recipent');
        require(isValid(amount , sign ) , "Wrong Signature");

        payable(msg.sender).transfer(amount);
        selfdestruct(sender);
    }

    function extendTimeout(uint newTime) public{
        require(msg.sender == sender,"Require Sender");
        require(expiration < block.timestamp,"you cannot increase");
        emit TimeExtended((newTime + block.timestamp));
        expiration = newTime;
    }

    function timeOut() public{
        require(msg.sender == sender,"Require sender");
        require(block.timestamp > expiration , "BlockTime");
        selfdestruct(payable(msg.sender));
    }

    function isValid(uint amount , bytes memory sign) view public returns(bool){
        bytes32 message = prefixed(keccak256(abi.encodePacked(amount , this )));
        return recover(message , sign) == sender;
    }

    function recover(bytes32 message , bytes memory sign) pure public returns(address){
        (bytes32 r , bytes32 s , uint8 v) = splitSignautre(sign);
        return ecrecover(message , v,r,s);
    } 

    function splitSignautre(bytes memory sing) public pure returns(bytes32 r , bytes32 s, uint8 v) {
        require(sing.length == 65);
        assembly {
            r := mload(add(sing , 32))
            s := mload(add(sing, 64))
            v := byte(0,mload(add(sing , 96)))
        }
    }

    function prefixed(bytes32 message) public pure returns(bytes32 ){
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32",message));
    }

    function getMessageHash(uint amount ) public view returns(bytes32){
        return keccak256(abi.encodePacked(amount , this));
    }
    function getBalanceNow() public view returns(uint){
        return address(this).balance;
    }
    function getTimeStamp() public view returns(uint){
        return block.timestamp;
    }    
    function getExpiration() public view returns(uint){
        return block.timestamp + expiration;
    }
}