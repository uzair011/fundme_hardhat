const { network } = require("hardhat")

const { DECIMALS, INITIAL_ANSWER } = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    // if (developmentChains.includes(network.name)) {
    if (chainId === 31337) {
        log("Local network detected!!!, contract deploying...")
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANSWER],
        })
        log(`Mock deployed!!!`)
        log(`(-------------------------!-!-!-------------------------)`)
    }
}
module.exports.tags = ["all", "mocks"]
