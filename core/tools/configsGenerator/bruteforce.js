const util = require('../../util.js')
const config = util.getConfig()
const _ = require('lodash')
const flatten = require('flat')
const combos = require('combos')
const math = require('../../math.js')

const bruteforce = {
  generateRangesOfMethod () {
    let flattenRanges = flatten(config.ranges)

    return _.mapValues(flattenRanges, (value) => {
      if (_.includes(value, ':')) {
        let params = _.split(value, ':')

        return math.generateRange(+params[0], +params[2], +params[1])
      } else {
        return [value]
      }
    })
  },
  getAllCombinationsFromRanges (ranges) {
    const combinations = combos(_.mapValues(ranges, (value) => {
      if (math.isMatrix(value)) {
        return value._data
      } else {
        return value
      }
    }))

    let methodConfigs = []

    _.forEach(combinations, function (item) {
      let obj = {}

      _.forOwn(item, function (value, key) {
        obj = _.set(obj, key, value)
      })

      methodConfigs.push(obj)
    })

    return methodConfigs
  },
  generateAllBruteforceCombinations (configsOfMethodFromRange) {
    let options = []

    _.each(config.candleSizes, (candleSize) => {
      _.each(config.historySizes, (historySize) => {
        _.each(config.tradingPairs, (tradingPair) => {
          _.each(configsOfMethodFromRange, (methodConfig) => {
            _.each(config.dateranges, (daterange) => {
              let option = {
                candleSize: candleSize,
                historySize: historySize,
                tradingPair: {
                  exchange: tradingPair[0],
                  currency: tradingPair[1],
                  asset: tradingPair[2]
                },
                paperTrader: config.paperTrader,
                method: config.method,
                daterange: daterange
              }

              option[config.method] = methodConfig

              options.push(option)
            })
          })
        })
      })
    })

    if (config.shuffle) {
      options = _.shuffle(options)
    }

    return options
  }
}

module.exports = bruteforce
