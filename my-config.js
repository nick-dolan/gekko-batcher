const config = {};

const _ = require('lodash');
const moment = require('moment');

let getAllStrategyNames = function (path) {
    const fs = require('fs');

    let arr = []

    fs.readdirSync(path + 'strategies/').forEach(file => {
        arr.push(file.replace(/.js/g, ''));
    })

    return arr.filter(function (v, index, arr) {
        return !(v === 'indicators' || v === '.DS_Store');
    });
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                          GENERAL SETTINGS
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

config.gekkoPath = '../gekko/';

config.apiUrl = "http://localhost:3000";

config.parallelQueries = 5;

config.candleSizes = [60];

config.historySizes = [16];

// Format: [exchange, currency, asset]
config.tradingPairs = [
    ["poloniex", "ETH", "ZEC"],
];

config.dateranges = [{
    from: '2018-07-01 00:00',
    to: '2018-08-01 00:00'
}, {
    from: '2018-12-01 00:00',
    to: '2018-12-15 00:00'
}];

// Initial balance, fees and slippage/spread
config.paperTrader = {
    simulationBalance: {
        currency: 50,
        asset: 0
    },
    feeMaker: 0.25,
    feeTaker: 0.25,
    feeUsing: 'maker',
    slippage: 0.05,
}

// Where to get method's settings.
// The first has high priority. Then second, if there's no settings in first place and so on.

// batcher – strategy settings below here
// gekko – gekko's config.js
// toml.js – gekko's toml files
config.configPriorityLocations = ['batcher', 'gekko', 'gekko-toml'];

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                          BACKTEST BATCHER
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

let allStratagies = getAllStrategyNames(config.gekkoPath);

// console.log(allStratagies);

// config.methods = allStratagies;
config.methods = ["RSI", "CCI"];
// config.methods = ["x2_rsi"];

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                          BRUTEFORCE SEARCHER
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

config.method = 'RSI';

// Shuffle generated combinations of method's configs
config.shuffle = true;

// Generate all possible combinations of set of settings with given ranges
// Format for range: 'start:step:end'
config.ranges = {
    interval: '8:1:10',
    thresholds: {
        low: '24:1:26',
        high: '70:1:80',
        persistence: 1
    }
};

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
};

config.MACD = {
    short: 10,
    long: 21,
    signal: 9,
    thresholds: {
        down: -0.000025,
        up: 0.000025,
        persistence: 1
    }
};

module.exports = config;