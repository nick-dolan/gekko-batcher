const program = require('commander')
const fs = require('fs')
const log = console.log

program
  .version('0.1.0')
  .option('-c, --config <file>', 'Config file')
  .parse(process.argv)

const util = {
  config: {},
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
    const ROOT = __dirname + '/../'

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
  errorHandler (err) {
    if (err.code === 'ECONNREFUSED') {
      util.die('Gekko isn\'t running probably. Go to Gekko\'s folder and type: node gekko --ui')
    } else if (err.response.status === 500) {
      log(err.response.statusText)
    }
  }
}

module.exports = util
