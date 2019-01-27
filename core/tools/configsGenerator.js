/* Generate all possible combinations */

const fs = require('fs');
const _ = require('lodash');
const toml = require('toml');
const util = require('../util.js');
const math = require('../math.js');
const flatten = require('flat');
const combos = require('combos');

const config = util.getConfig();
const gekkoConfig = util.getGekkoConfig();
const mode = util.backtestMode();

const configsGenerator = {
    generateRangesOfMethod() {
        let flattenRanges = flatten(config.ranges);

        return _.mapValues(flattenRanges, (value) => {
            if (_.includes(value, ':')) {
                let params = _.split(value, ':');

                return math.generateRange(+params[0], +params[2], +params[1]);
            }
            else {
                return [value];
            }
        });
    },
    getAllCombinationsFromRanges(ranges) {
        const combinations = combos(_.mapValues(ranges, (value) => {
            if (math.isMatrix(value)) {
                return value._data;
            }
            else {
                return value;
            }
        }));

        let methodConfigs = [];

        _.forEach(combinations, function (item) {
            let obj = {};

            _.forOwn(item, function (value, key) {
                obj = _.set(obj, key, value);
            });

            methodConfigs.push(obj);
        })

        return methodConfigs;
    },
    generateAllBruteforceCombinations(configsOfMethodFromRange) {
        let options = [];

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
                            };

                            option[config.method] = methodConfig;

                            options.push(option);
                        })
                    })
                })
            })
        })

        if (config.shuffle) {
            options = _.shuffle(options);
        }

        return options;
    },
    generateAllBatchCombinations(methodConfigs) {
        let options = [];

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
                            };

                            option[method] = methodConfigs[method].settings;

                            options.push(option);
                        })
                    })
                })
            })
        })

        if (config.shuffle) {
            options = _.shuffle(options);
        }

        return options;
    },
    getAllMethodConfigs() {
        let methodConfigs = [];
        let methods = config.methods;

        _.each(methods, (method) => {
            methodConfigs[method] = configsGenerator.getMethodSettingsByPriority(method, config.configPriorityLocations);
        })

        return methodConfigs;
    },
    getMethodSettingsByPriority(name, locations) {
        let result = {};

        _.each(locations, (location) => {
            let methodSettings = configsGenerator.getMethodSettingsByLocation(name, location);

            if (!_.isEmpty(methodSettings)) {
                result = {
                    location: location,
                    settings: methodSettings
                }

                return false;
            }
        })

        return result;
    },
    getMethodSettingsByLocation(name, location) {
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
            return configsGenerator.getTOML(`${util.dirs().gekkoTOML}/${name}.toml`);
        }
        else {
            log(`There is no such config\'s location as ${location}`);

            process.exit();
        }
    },
    getTOML(path) {
        try {
            let raw = fs.readFileSync(path);

            return toml.parse(raw);
        } catch (err) {
            return {};
        }
    },
    prepareAllConfigsForGekko(configs) {
        let allConfigs = [];

        _.each(configs, (config) => {
            let backtestConfig = configsGenerator.prepareConfigForGekko(config);

            backtestConfig[config.method] = config[config.method];

            allConfigs.push(backtestConfig);
        })

        return allConfigs;
    },
    prepareConfigForGekko(options) {
        // console.log(options)

        let config = {
            "watch": {
                "exchange": options.tradingPair.exchange,
                "currency": options.tradingPair.currency,
                "asset": options.tradingPair.asset
            },
            "paperTrader": {
                "feeMaker": options.paperTrader.feeMaker,
                "feeTaker": options.paperTrader.feeTaker,
                "feeUsing": options.paperTrader.feeUsing,
                "slippage": options.paperTrader.slippage,
                "simulationBalance": options.paperTrader.simulationBalance,
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
                    "from": options.daterange.from,
                    "to": options.daterange.to
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
            "valid": true,
        };

        if (options.settingsLocation) {
            config["configLocation"] = options.settingsLocation;
        }

        return config;
    }
}

module.exports = configsGenerator;