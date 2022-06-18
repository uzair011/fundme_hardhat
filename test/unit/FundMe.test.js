const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")

describe("FundMe", async function () {
    let fundMe, deployer, mockV3Aggregator
    const sendValue = ethers.utils.parseEther("1") // 1 eth
    beforeEach(async function () {
        // deploy fundMe contract with hardhat
        // const accounts = await ethers.getSigners()
        // const accountZero = accounts[0]
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture("all") // deploy all the scripts (with tags - all)
        fundMe = await ethers.getContract("FundMe", deployer)
        mockV3Aggregator = await ethers.getContract(
            "MockV3Aggregator",
            deployer
        )
    })

    describe("Constructor", async function () {
        it("sets the aggregator address correctly", async function () {
            const response = await fundMe.getPriceFeed()
            assert.equal(response, mockV3Aggregator.address)
        })
    })

    describe("fund", async function () {
        it("fails when you send not enouth ETH", async function () {
            await expect(fundMe.fund()).to.be.revertedWith(
                "You need to spend more ETH!"
            )
        })

        it("Update the getAddressToAmountFunded mapping data structure", async () => {
            await fundMe.fund({ value: sendValue })
            const response = await fundMe.getAddressToAmountFunded(deployer)
            assert.equal(response.toString(), sendValue.toString())
        })

        it("Add getFunders to the getFunders array", async () => {
            await fundMe.fund({ value: sendValue })
            const getFundersArray = await fundMe.getFunders(0)
            assert.equal(getFundersArray, deployer)
        })
    })

    describe("withdraw", async function () {
        beforeEach(async function () {
            await fundMe.fund({ value: sendValue })
        })

        it("withraw eth from a single funder", async function () {
            // ? arrange
            const startingFundmeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )
            // ? act
            const transactionResponse = await fundMe.withdraw()

            const transactionReceipt = await transactionResponse.wait(1)
            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const totGasCost = gasUsed.mul(effectiveGasPrice)

            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )
            // ? assert
            assert.equal(endingFundMeBalance, 0) // ending balance should be 0 after the withrawal
            assert.equal(
                endingDeployerBalance.add(totGasCost).toString(),
                startingDeployerBalance.add(startingFundmeBalance)
            ) /** .add => startingFundmeBalance type is BigNumber -> calling from the blockchain */
        })

        it("widthraw eth from multiple getFunders", async () => {
            // arrange
            const accounts = await ethers.getSigners()
            for (let i = 1; i < 6; i++) {
                const fundMeConnectedAccount = await fundMe.connect(accounts[i])
                await fundMeConnectedAccount.fund({ value: sendValue })
            }
            const startingFundmeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )

            // act
            const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = transactionResponse.wait(1)
            const { gasUsed, effectiveGasPrice } = await transactionReceipt
            const totGasCost = gasUsed.mul(effectiveGasPrice)

            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )
            // ? assert
            assert.equal(endingFundMeBalance, 0) // ending balance should be 0 after the withrawal
            assert.equal(
                endingDeployerBalance.add(totGasCost).toString(),
                startingDeployerBalance.add(startingFundmeBalance)
            ) /** .add => startingFundmeBalance type is BigNumber -> calling from the blockchain */

            // ? getFunders array should be reset properly
            await expect(fundMe.getFunders(0)).to.be.reverted
            for (let i = 1; i < 6; i++) {
                assert.equal(
                    await fundMe.getAddressToAmountFunded(accounts[i].address),
                    0
                )
            }
        })

        it("only the  owner is allowed to withdraw the money", async () => {
            // other accounts (not the owner) calls the withdraw, it will be reverted automatically
            const accounts = await ethers.getSigners()
            const attacker = accounts[1]
            const attackerConnectedAccount = await fundMe.connect(attacker)
            await expect(
                attackerConnectedAccount.withdraw()
            ).to.be.revertedWith("FundMe__NotOwner")
        })
        // !---------------------------
        it("cheeper withdraw testing...", async () => {
            // arrange
            const accounts = await ethers.getSigners()
            for (let i = 1; i < 6; i++) {
                const fundMeConnectedAccount = await fundMe.connect(accounts[i])
                await fundMeConnectedAccount.fund({ value: sendValue })
            }
            const startingFundmeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )

            // act
            const transactionResponse = await fundMe.cheeperWithdraw()
            const transactionReceipt = transactionResponse.wait(1)
            const { gasUsed, effectiveGasPrice } = await transactionReceipt
            const totGasCost = gasUsed.mul(effectiveGasPrice)

            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )
            // ? assert
            assert.equal(endingFundMeBalance, 0) // ending balance should be 0 after the withrawal
            assert.equal(
                endingDeployerBalance.add(totGasCost).toString(),
                startingDeployerBalance.add(startingFundmeBalance)
            ) /** .add => startingFundmeBalance type is BigNumber -> calling from the blockchain */

            // ? getFunders array should be reset properly
            await expect(fundMe.getFunders(0)).to.be.reverted
            for (let i = 1; i < 6; i++) {
                assert.equal(
                    await fundMe.getAddressToAmountFunded(accounts[i].address),
                    0
                )
            }
        })

        // !-----------
        it("cheeper withraw  single funder", async function () {
            // ? arrange
            const startingFundmeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )
            // ? act
            const transactionResponse = await fundMe.cheeperWithdraw()

            const transactionReceipt = await transactionResponse.wait(1)
            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const totGasCost = gasUsed.mul(effectiveGasPrice)

            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )
            // ? assert
            assert.equal(endingFundMeBalance, 0) // ending balance should be 0 after the withrawal
            assert.equal(
                endingDeployerBalance.add(totGasCost).toString(),
                startingDeployerBalance.add(startingFundmeBalance)
            ) /** .add => startingFundmeBalance type is BigNumber -> calling from the blockchain */
        })
    })
})
