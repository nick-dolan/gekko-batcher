const util = require('../../util.js')
const config = util.getConfig()
const _ = require('lodash')

const batch = {
  generateAllBatchCombinations (methodConfigs) {
    let options = []

    _.each(config.candleSizes, (candleSize) => {
      _.each(config.historySizes, (historySize) => {
        _.each(config.tradingPairs, (tradingPair) => {
          _.each(config.methods, (method) => {
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
                method: method,
                settingsLocation: methodConfigs[method].location,
                daterange: daterange
              }

              option[method] = methodConfigs[method].settings || {
                // If there's no settings put default data about the strategy
                name: config.name,
                method: method,
                historySize: historySize,
                candleSize: candleSize,
                daterange: daterange,
                exchange: tradingPair[0],
                tradingPair: `${tradingPair[1]}/${tradingPair[2]}`
              }

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

module.exports = batch
