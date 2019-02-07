const config = {}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                          GENERAL SETTINGS
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

config.gekkoPath = '../gekko/'
config.gekkoConfigFileName = 'config.js'

// URL that serving Gekko UI
config.apiUrl = 'http://localhost:3000'

// Keep it lower than the number of cores you have
config.parallelQueries = 3

config.candleSizes = [30, 60]

config.historySizes = [10, 15]

// Format: [exchange, currency, asset]
config.tradingPairs = [
  ['binance', 'usdt', 'btc'],
  ['poloniex', 'eth', 'zec']
]

config.dateranges = [{
  from: '2018-06-05 00:00',
  to: '2018-07-05 00:00'
}, {
  from: '2018-06-05 00:00',
  to: '2018-07-30 00:00'
}]

// Shuffle generated combinations of method's configs
config.shuffle = true

// Initial balance, fees and slippage/spread
config.paperTrader = {
  simulationBalance: {
    currency: 1000,
    asset: 1
  },
  feeMaker: 0.25,
  feeTaker: 0.25,
  feeUsing: 'maker',
  slippage: 0.05
}

// Where to get method's settings.
// The first has high priority. Then second, if there's no settings in first place and so on.

// batcher – strategy settings below here
// gekko – gekko's config.js
// toml.js – gekko's toml files
config.configPriorityLocations = ['batcher', 'gekko', 'gekko-toml']

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                          BACKTEST BATCHER
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

config.methods = ['RSI', 'MACD', 'StochRSI', 'CCI']

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                          BRUTEFORCE SEARCHER
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Specify strategy you want for bruteforce
config.method = 'RSI'

// Specify ranges settings for the given method. It generates all
// possible combinations of a set of settings with given ranges
// Format for range: 'start:step:end' or 'true|false'
config.ranges = {
  interval: '8:1:10',
  thresholds: {
    low: '24:1:26',
    high: '70:1:80',
    persistence: 1
  }
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                          STRATEGY SETTINGS
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

config.RSI = {
  interval: 15,
  thresholds: {
    low: 25,
    high: 75,
    persistence: 1
  }
}

config.MACD = {
  short: 10,
  long: 21,
  signal: 9,
  thresholds: {
    down: -0.000025,
    up: 0.000025,
    persistence: 1
  }
}

module.exports = config
