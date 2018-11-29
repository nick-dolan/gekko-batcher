const config = {};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                          GENERAL SETTINGS
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

config.gekkoPath = '../gekko/';

config.apiUrl = "http://localhost:3000";

config.parallelQueries = 4;

// Settings that use both tools

config.candleSizes = [45, 60, 75];

config.historySizes = [10, 15];

// Format: [exchange, currency, asset]
config.tradingPairs = [
    ["poloniex", "eth", "zec"],
    ["poloniex", "eth", "bch"]
];

config.daterange = {
    from: '2018-03-19T17:16:00Z',
    to: '2018-06-19T17:16:00Z'
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                          BACKTEST BATCHER
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

config.methods = ['RSI', 'MACD', 'StochRSI'];

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                          BRUTEFORCE SEARCHER
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

config.method = 'MACD';

// Shuffle generated combinations of method's configs
config.shuffle = true;

// Generate all possible permutations of an object's key-value pairs.
// One-level object of properties only. Property names must match the name of method's properties from all levels of nesting.
// Format: 'start:step:end'
config.ranges = {
    interval: '12:1:14',
    low: '28:1:30',
    high: '68:1:72',
    persistence: '1:0.5:2'
};

module.exports = config;