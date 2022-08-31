
const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const time = Math.floor(Date.now() / 1000);
const n_Time = time;
const devlopmentChains = ["localhost", "hardhat"];

!devlopmentChains.includes(network.name)
  ? describe.skip
  : describe("Contract Deployed", async function () {
      let PaymentChannel, deployer, playerOne, hash, Amount;

      beforeEach(async function () {
        const txx = await deployments.fixture(["all"]);
        const accounts = await ethers.getSigners();
        deployer = accounts[0];
        playerOne = accounts[1];
        PaymentChannel = await ethers.getContract("PaymentChannel", deployer);
        Amount = ethers.utils.parseEther("0.1");
        const messageHash = await PaymentChannel.getMessageHash(Amount);
        hash = await deployer.signMessage(ethers.utils.arrayify(messageHash));
      });

      describe("Constructor", () => {
        it("Check whether expiration is set and recipent", async function () {
          const sender = await PaymentChannel.sender();
          const recipent = await PaymentChannel.recipent();
          const expiration = await PaymentChannel.expiration();
          assert.equal(sender.toString(), deployer.address);
          assert.equal(recipent.toString(), playerOne.address);
          assert(expiration.toString() != n_Time.toString());
        });
      });

      describe("Close", () => {
        it("Expect Only recipent can spend", async function () {
          await expect(PaymentChannel.close(Amount, hash)).to.be.revertedWith(
            "Require Recipent"
          );
        });
        it("Is Valid Signature", async function () {
          await expect(
            PaymentChannel.connect(playerOne).close(Amount + 1, hash)
          ).to.be.revertedWith("Wrong Signature");
        });
        it("transfer the money", async function () {
          const payment = await PaymentChannel.connect(playerOne).close(
            Amount,
            hash
          );
          const balanceOf = await playerOne.getBalance();
          assert(payment.toString() != balanceOf.toString());
        });
      });

      describe("extend Timeout", () => {
        it("msg.sender to be sender", async function () {
          await expect(
            PaymentChannel.connect(playerOne).extendTimeout(n_Time + 1000)
          ).to.be.revertedWith("Require Sender");
        });
        it("Only increase when timestamp is less", async function () {
          await expect(PaymentChannel.extendTimeout(1000)).to.be.revertedWith(
            "you cannot increase"
          );
        });
        it("Increase Time and set expiration", async function () {
          await network.provider.send("evm_increaseTime", [9000]);
          await network.provider.send("evm_mine");
          const extendTimeout = await PaymentChannel.extendTimeout(1000);
          const tx = await extendTimeout.wait(1);
          const res = await tx.events[0].args.Time;
          const getexpiration = await PaymentChannel.getExpiration();
          assert.equal(getexpiration.toNumber(), res.toNumber());
        });
      });

      describe("TimeOut", () => {
        it("Check whether msg.sender is sender", async function () {
          await expect(
            PaymentChannel.connect(playerOne).timeOut()
          ).to.be.revertedWith("Require sender");
        });
        it("BlockTimeStamp Should be greater than expiration", async function () {
          await expect(PaymentChannel.timeOut()).to.be.revertedWith(
            "BlockTime"
          );
        });
        it("Self Destruct it", async function () {
          const BeforeBalance = await deployer.getBalance();
          await network.provider.send("evm_increaseTime", [10000]);
          await network.provider.send("evm_mine");
          const TimeOut = await PaymentChannel.timeOut();
          await TimeOut.wait();
          const getBalance = await deployer.getBalance();
          assert(BeforeBalance.toString() < getBalance.toString());
        });
      });
    });
