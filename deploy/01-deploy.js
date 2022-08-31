const { ethers, network } = require("hardhat");
const time = Math.floor(Date.now() / 1000)
const unixTime = time + 300;
const devlopmentChains = ["localhost","hardhat"]
const {verify} = require("../utils/verify")

module.exports = async function({getNamedAccounts , deployments}){

    const {deploy,log} = deployments;
    const {deployer} = await getNamedAccounts();
    const accounts = await ethers.getSigners();
    const Amount = ethers.utils.parseEther("0.1");

    let args 
    if(devlopmentChains.includes(network.name)){
        args = [accounts[1].address,unixTime]
    }else{
        args = ["0x87eA22A0D0c788C2f223d3eAC004D5568672A341",unixTime]
    }

    const PaymentChannel = await deploy("PaymentChannel",{
        from : deployer,
        log : true,
        args : args,
        value : Amount,
        waitConfirmations : 20
    })
    if(!devlopmentChains.includes(network.name)){
        log("Verifying Contract");
        await verify(PaymentChannel.address,args);
    }
}

module.exports.tags = ["all","PaymentChannel"];