const program = require('commander')
const fs = require('fs')
const path = require('path')

program
  .version('0.1.0')
  .option('-c, --config <file>', 'Config file')
  .parse(process.argv)

const util = {
  config: {},
  mode: '',
  getConfig () {
    if (!program.config) {
      util.die('Please specify a config file.')
    } else if (!fs.existsSync(util.dirs().batcher + program.config)) {
      util.die('Cannot find the specified config file.')
    }

    util.config = require(util.dirs().batcher + program.config)

    return this.config
  },
  getGekkoConfig () {
    let gekkoConfig = util.dirs().gekko + util.config.gekkoConfigFileName

    if (fs.existsSync(gekkoConfig)) {
      return require(gekkoConfig)
    } else {
      util.die('Cannot find Gekko\'s config file.')
    }
  },
  die (message) {
    const log = console.log.bind(console)

    if (message) {
      log(`\n ERROR: ${message}\n`)
    }

    process.exit(1)
  },
  dirs () {
    const ROOT = path.join(__dirname, '/../')

    return {
      batcher: ROOT,
      core: ROOT + 'core/',
      tools: ROOT + 'core/tools/',
      gekko: ROOT + util.config.gekkoPath,
      gekkoTOML: ROOT + util.config.gekkoPath + 'config/strategies'
    }
  },
  createResultsFolder () {
    if (!fs.existsSync('./results')) {
      fs.mkdirSync('./results')
    }
  },
  countTime (allCombinations, completedBacktests, spentTime, step) {
    if (completedBacktests % step === 0) {
      let completedSteps = completedBacktests / step
      let remainingBacktests = allCombinations - completedBacktests
      let remainingSteps = remainingBacktests / step
      let realSpentTime = spentTime / util.config.parallelQueries
      let remainingTime = 0

      if (completedSteps === 1) {
        remainingTime = remainingSteps * realSpentTime
      } else if (completedSteps > 1) {
        remainingTime = remainingSteps * realSpentTime / completedSteps
      }

      return {
        remaining: remainingTime,
        spent: realSpentTime
      }
    }
  }
}

module.exports = util
