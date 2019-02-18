const program = require('commander')
const fs = require('fs')
const path = require('path')
const moment = require('moment')
const _ = require('lodash')
const log = console.log

program
  .version('0.1.0')
  .option('-c, --config <file>', 'Config file')
  .parse(process.argv)

const util = {
  config: {},
  mode: '',
  getConfig () {
    let isConfigExists = fs.existsSync(util.dirs().batcher + program.config)

    if (!program.config) {
      util.die('Please specify a config file.')
    } else if (!isConfigExists) {
      util.die('Cannot find the specified config file.')
    }

    util.config = require(util.dirs().batcher + program.config)

    if (isConfigExists) {
      if (util.mode === 'import' && util.config.parallelQueries > 1) {
        if (util.config.dateranges.length > 1) {
          util.die('Only one daterange allowed in mode "import" if parallelQueries bigger 1')
        }
      }
    }

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
      results: ROOT + 'results/',
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
  },
  generateFileName () {
    return `${_.capitalize(util.mode)} (${moment().format('MMM Do YY, HH-mm')}).csv`
  },
  errorHandler (err) {
    if (err.code === 'ECONNREFUSED') {
      util.die('Gekko isn\'t running probably. Go to Gekko\'s folder and type: node gekko --ui')
    } else if (err.response && err.response.status) {
      if (err.response.status === 500) {
        log(err.response.data, err.message)
        log('See Gekko\'s logs to find out the reason')
      }
    } else {
      log(err)
    }
  }
}

module.exports = util
