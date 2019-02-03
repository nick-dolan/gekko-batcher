/* Generate all possible combinations */

const fs = require('fs')
const _ = require('lodash')
const toml = require('toml')
const util = require('../util.js')
const log = console.log

const config = util.getConfig()
const gekkoConfig = util.getGekkoConfig()
// const mode = util.backtestMode()

const batch = require('./configsGenerator/batch')
const bruteforce = require('./configsGenerator/bruteforce')

const configsGenerator = {
  getAllMethodConfigs () {
    let methodConfigs = []
    let methods = config.methods

    _.each(methods, (method) => {
      methodConfigs[method] = configsGenerator.getMethodSettingsByPriority(method, config.configPriorityLocations)
    })

    return methodConfigs
  },
  getMethodSettingsByPriority (name, locations) {
    let result = {}

    _.each(locations, (location) => {
      let methodSettings = configsGenerator.getMethodSettingsByLocation(name, location)

      if (!_.isEmpty(methodSettings)) {
        result = {
          location: location,
          settings: methodSettings
        }

        return false
      }
    })

    return result
  },
  getMethodSettingsByLocation (name, location) {
    if (location === 'batcher') {
      if (!_.isEmpty(config[name])) {
        return config[name]
      }
    } else if (location === 'gekko') {
      if (!_.isEmpty(gekkoConfig[name])) {
        return gekkoConfig[name]
      }
    } else if (location === 'gekko-toml') {
      return configsGenerator.getTOML(`${util.dirs().gekkoTOML}/${name}.toml`)
    } else {
      log(`There is no such config's location as ${location}`)

      process.exit()
    }
  },
  getTOML (path) {
    try {
      let raw = fs.readFileSync(path)

      return toml.parse(raw)
    } catch (err) {
      return {}
    }
  },
  prepareAllConfigsForGekko (configs) {
    let allConfigs = []

    _.each(configs, (config) => {
      let backtestConfig = configsGenerator.prepareConfigForGekko(config)

      backtestConfig[config.method] = config[config.method]

      allConfigs.push(backtestConfig)
    })

    return allConfigs
  },
  prepareConfigForGekko (options) {
    let config = {
      'watch': {
        'exchange': options.tradingPair.exchange,
        'currency': options.tradingPair.currency,
        'asset': options.tradingPair.asset
      },
      'paperTrader': {
        'feeMaker': options.paperTrader.feeMaker,
        'feeTaker': options.paperTrader.feeTaker,
        'feeUsing': options.paperTrader.feeUsing,
        'slippage': options.paperTrader.slippage,
        'simulationBalance': options.paperTrader.simulationBalance,
        'reportRoundtrips': true,
        'enabled': true
      },
      'tradingAdvisor': {
        'enabled': true,
        'method': options.method,
        'candleSize': options.candleSize,
        'historySize': options.historySize
      },
      'backtest': {
        'daterange': {
          'from': options.daterange.from,
          'to': options.daterange.to
        }
      },
      'backtestResultExporter': {
        'enabled': true,
        'writeToDisk': false,
        'data': {
          'stratUpdates': false,
          'roundtrips': false,
          'stratCandles': false,
          'stratCandleProps': ['open'],
          'trades': false
        }
      },
      'performanceAnalyzer': {
        'riskFreeReturn': 2,
        'enabled': true
      },
      'valid': true
    }

    if (options.settingsLocation) {
      config['configLocation'] = options.settingsLocation
    }

    return config
  }
}

_.assign(configsGenerator, batch)
_.assign(configsGenerator, bruteforce)

module.exports = configsGenerator
