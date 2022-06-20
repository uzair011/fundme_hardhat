/* eslint-disable no-unused-expressions */
const { ethers, getNamedAccounts, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { assert } = require("chai")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("staging tests - FundMe", async function () {
          let fundMe
          let deployer
          const sendValue = ethers.utils.parseEther("0.1")

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              fundMe = await ethers.getContract("FundMe", deployer)
          })

          it("Allows people to fund and withdraw", async function () {
              await fundMe.fund({ value: sendValue })
              await fundMe.withdraw({
                  gasLimit: 100000,
              })
              const endingBalance = await fundMe.provider.getBalance(
                  fundMe.address
              )

              console.log(
                  endingBalance.toString() +
                      "Should equal to 0, running assert equal"
              )
              assert.equal(endingBalance.toString(), "0")
          })
      })
