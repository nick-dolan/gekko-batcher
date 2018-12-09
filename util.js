const log = console.log;
const fs = require('fs');
const _ = require('lodash');
const toml = require('toml');
const math = require('mathjs');
const moment = require('moment');
const config = require('./config');
const momentDurationFormatSetup = require("moment-duration-format");
momentDurationFormatSetup(moment);

const tomlConfigPath = config.gekkoPath + 'config/strategies';
let gekkoConfig = {};

if (fs.existsSync(config.gekkoPath + 'config.js')) {
    gekkoConfig = require(config.gekkoPath + 'config.js');
}

/*
* Helper functions
* */
const util = {
    getTOML: function (fileName) {
        let raw = fs.readFileSync(fileName);

        return toml.parse(raw);
    },
    countDecimals: function (a) {
        if (!isFinite(a)) {
            return 0;
        }

        var e = 1,
            p = 0;

        while (Math.round(a * e) / e !== a) {
            e *= 10;
            p++;
        }

        return p;
    },
    round(number, precision) {
        if (!precision) {
            precision = 2
        }

        return math.round(+number, precision);
    },
    isMatrix: function (v) {
        if (v) {
            return math.typeof(v) === 'Matrix';
        }
    },
    // Format Date. Result: November 2, 2018 2:34 PM
    humanizeDate: function (date) {
        return moment(date).format('lll');
    },
    generateRange: function (start, end, step) {
        if (step && end) {
            let arr = math.range(start, end, step, true);

            return arr.map(function (number) {
                return number.toFixed(util.countDecimals(step))
            });

        }
        else {
            return math.range(start, end, 1, true);
        }
    },
    getMethodSettingsByLocation: function (name, location) {
        if (location === 'batcher') {
            if (!_.isEmpty(config[name])) {
                return config[name];
            }
        }
        else if (location === 'gekko') {
            if (!_.isEmpty(gekkoConfig[name])) {
                return gekkoConfig[name];
            }
        }
        else if (location === 'gekko-toml') {
            return util.getTOML(`${tomlConfigPath}/${name}.toml`);
        }
        else {
            log('There is no such config\'s location as ' + location);
        }
    },
    getMethodSettingsByPriority: function (name, locations) {
        let result = {};

        _.forEach(locations, function (location) {
            let config = util.getMethodSettingsByLocation(name, location);

            if (!_.isEmpty(config)) {
                result = {
                    location: location,
                    settings: config
                }

                return false;
            }
        })

        return result;
    },
    countRemainingTime: function (completedBacktests, allBacktests, spentTime, step = 10) {
        if (completedBacktests % step === 0) {
            let stepsCompleted = completedBacktests / step;
            let remainingBacktests = allBacktests - completedBacktests;
            let stepsRemaining = remainingBacktests / step;
            let spentTimeReal = spentTime / config.parallelQueries;
            let remainingTime = 0;

            if (stepsCompleted === 1) {
                remainingTime = stepsRemaining * spentTimeReal;
            }
            else if (stepsCompleted > 1) {
                remainingTime = stepsRemaining * spentTimeReal / stepsCompleted;
            }

            log('Spent time:', moment.duration(spentTimeReal).format("d [days], h [hours], m [minutes], s [seconds]"));
            log('Approximately remaining time:', moment.duration(remainingTime).format("d [days], h [hours], m [minutes], s [seconds]"), `(${moment.duration(remainingTime).humanize()})`);
        }
    },
    getConfig: function (options, daterange) {
        return {
            "watch": {
                "exchange": options.tradingPair.exchange,
                "currency": options.tradingPair.currency,
                "asset": options.tradingPair.asset
            },
            "paperTrader": {
                "feeMaker": 0.25,
                "feeTaker": 0.25,
                "feeUsing": "maker",
                "slippage": 0.05,
                "simulationBalance": {"asset": 1, "currency": 100},
                "reportRoundtrips": true,
                "enabled": true
            },
            "tradingAdvisor": {
                "enabled": true,
                "method": options.method,
                "candleSize": options.candleSize,
                "historySize": options.historySize
            },
            "backtest": {
                "daterange": {
                    "from": daterange.from,
                    "to": daterange.to
                }
            },
            "backtestResultExporter": {
                "enabled": true,
                "writeToDisk": false,
                "data": {
                    "stratUpdates": false,
                    "roundtrips": false,
                    "stratCandles": false,
                    "stratCandleProps": ["open"],
                    "trades": false
                }
            },
            "performanceAnalyzer": {
                "riskFreeReturn": 2,
                "enabled": true
            },
            "valid": true
        };
    }
}

module.exports = util;