const program = require('commander')
const fs = require('fs')

program
  .version('0.1.0')
  .option('-c, --config <file>', 'Config file')
  .option('-b, --batch', 'Batch mode')
  .option('-f, --bruteforce', 'Bruteforce mode')
  .parse(process.argv)

const config = require('../' + program.config)

const util = {
  getConfig () {
    if (!program.config) {
      util.die('Please specify a config file.')
    }

    if (!fs.existsSync(util.dirs().batcher + program.config)) {
      util.die('Cannot find the specified config file.')
    }

    return require(util.dirs().batcher + program.config)
  },
  getGekkoConfig () {
    let gekkoConfig = util.dirs().gekko + config.gekkoConfigFileName

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
    const ROOT = __dirname + '/../'

    return {
      batcher: ROOT,
      core: ROOT + 'core/',
      tools: ROOT + 'core/tools/',
      gekko: ROOT + config.gekkoPath,
      gekkoTOML: ROOT + config.gekkoPath + 'config/strategies'
    }
  },
  backtestMode () {
    if (program['batch']) {
      return 'batch'
    } else if (program['bruteforce']) {
      return 'bruteforce'
    } else {
      util.die('Unknown mode')
    }
  }
}

module.exports = util