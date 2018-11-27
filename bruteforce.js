require('events').EventEmitter.defaultMaxListeners = 100;
require('toml-require').install();
const axios = require('axios');
const promiseLimit = require('promise-limit');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const moment = require('moment');
const math = require('mathjs')
const empty = require('is-empty');
const upperCaseFirst = require('upper-case-first');
const chalk = require('chalk');
const log = console.log;
const {table} = require('table');
const fs = require('fs');
const combos = require('combos');
const _ = require('deepdash')(require('lodash'));

let successBacktestCounter = 0;

let httpConfig = {
    headers: {'Content-Type': 'application/json'},
};

/*
* Set preferable ranges for method's options
* */
let method = 'RSI';

let ranges = {
    interval: generateRange(12, 14),
    low: generateRange(28, 30),
    high: generateRange(68, 71),
    persistence: generateRange(1, 2, 0.5)
};

/*
* Shuffle generated combinations of method's configs
* */
let shuffle = true;

/*
* Basic settings
* */
let gekkoPath = '../gekko/';
let apiUrl = "http://localhost:3000";
let strategiesConfigPath = gekkoPath + 'config/strategies';

let candleSizes = [45];
let historySizes = [10];
let tradingPairs = [["poloniex", "eth", "zec"]];
let daterange = {
    from: '2018-03-19T17:16:00Z',
    to: '2018-06-19T17:16:00Z'
};
let parallelQueries = 2;

/*
* Generate all possible combinations of selected ranges
* */
const combinations = combos(_.mapValues(ranges, function (value) {
    if (isMatrix(value)) {
        return value._data;
    }
}));

/*
* Prepare strategy config (put all real strategy configs into array)
* */
let strategyConfigs = [];
let originalMethodConfig = require(`${strategiesConfigPath}/${method}.toml`);

_.forEach(combinations, function (combination) {
    let obj = _.cloneDeep(originalMethodConfig);

    _.eachDeep(obj, (value, key, path, depth, parent, parentKey, parentPath) => {
        _.forOwn(combination, function (item, name) {
            if (key === name) {
                obj = addProps(obj, path, +item);
            }
        });
    });

    strategyConfigs.push(obj);
});

if (shuffle) {
    strategyConfigs = _.shuffle(strategyConfigs);
}

/*
* Collect settings
* */
let options = [];

for (let c = 0; c < candleSizes.length; c++) {
    for (let h = 0; h < historySizes.length; h++) {
        for (let t = 0; t < tradingPairs.length; t++) {
            for (let s = 0; s < strategyConfigs.length; s++) {
                let option = {
                    candleSize: candleSizes[c],
                    historySize: historySizes[h],
                    tradingPair: {
                        exchange: tradingPairs[t][0],
                        currency: tradingPairs[t][1],
                        asset: tradingPairs[t][2]
                    },
                    method: method
                };

                option[method] = strategyConfigs[s];

                options.push(option);
            }
        }
    }
}

/*
* Show the number of combinations
* */
log(options.length + ' ' + 'combinations');

/*
* Get config for backtest function
* */
function getConfig(options, daterange) {
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

/*
* Collect all settings for batcher
* */
let allConfigs = [];

for (let o = 0; o < options.length; o++) {
    let backtestConfig = getConfig(options[o], daterange);

    backtestConfig[options[o].method] = options[o][options[o].method];

    allConfigs.push(backtestConfig);
}

/*
* Prepare headers and configs for table output in terminal
* */
const tableHeaders = ['Method', 'Currency', 'Asset', 'Candle size', 'History size', 'Exchange', 'Strategy  performance (%)', 'Market performance (%)'];
const tableConfig = {
    columns: {
        3: {
            width: 6,
            wrapWord: true
        },
        4: {
            width: 7,
            wrapWord: true
        },
        6: {
            width: 15,
            wrapWord: true
        },
        7: {
            width: 15,
            wrapWord: true
        },
    }
};

let terminalTable = [];

/*
* Prepare headers for CSV
* */
if (!fs.existsSync('./results')) {
    fs.mkdirSync('./results');
}

const csvWriter = createCsvWriter({
    path: 'results/bruteforce.csv',
    header: [
        {id: 'method', title: 'Method'},
        {id: 'market_performance_percent', title: 'Market performance (%)'},
        {id: 'relative_profit', title: 'Strat performance (%)'},
        {id: 'profit', title: 'Profit'},
        {id: 'run_date', title: 'Run date'},
        {id: 'run_time', title: 'Run time'},
        {id: 'start_date', title: 'Start date'},
        {id: 'end_date', title: 'End date'},
        {id: 'currency_pair', title: 'Currency pair'},
        {id: 'candle_size', title: 'Candle size'},
        {id: 'history_size', title: 'History size'},
        {id: 'currency', title: 'Currency'},
        {id: 'asset', title: 'Asset'},
        {id: 'exchange', title: 'Exchange'},
        {id: 'timespan', title: 'Timespan'},
        {id: 'yearly_profit', title: 'Yearly profit'},
        {id: 'yearly_profit_percent', title: 'Yearly profit (%)'},
        {id: 'start_price', title: 'Start price'},
        {id: 'end_price', title: 'End price'},
        {id: 'trades', title: 'Trades'},
        {id: 'start_balance', title: 'Start balance'},
        {id: 'sharpe', title: 'Sharpe'},
        {id: 'alpha', title: 'Alpha'},
        {id: 'config', title: 'Config'},
        {id: 'downside', title: 'Downside'},
    ]
});

/*
* Run backtests
* */
let limit = promiseLimit(parallelQueries);

Promise.all(allConfigs.map((config) => {
    return limit(function () {
        return runBacktest(config);
    })
})).then(results => {
    if (successBacktestCounter > 0) {
        if (terminalTable.length > 100) {
            log(chalk.hex('#fafafa').bgHex('#00bf79')('100 most profitale results:'));
        }
        else {
            log(chalk.hex('#fafafa').bgHex('#00bf79')('Results:'));
        }

        terminalTable.unshift(tableHeaders);

        terminalTable.sort(function (a, b) {
            return b[6] > a[6] ? 1 : -1;
        });

        log(table(terminalTable.slice(0, 100), tableConfig));

        log(chalk.hex('#fafafa').bgHex('#00bf79')(':: See full results in results/results.csv ::', '\n'));
    }
    else {
        log(chalk.red('There are no any results'));
    }
});

function runBacktest(config) {
    log(chalk.cyan('Started:', chalk.dim(`${config.tradingAdvisor.method} ${config.watch.currency.toUpperCase()}/${config.watch.asset.toUpperCase()} ${config.tradingAdvisor.candleSize}/${config.tradingAdvisor.historySize} ${upperCaseFirst(config.watch.exchange)}`)));

    process.on('unhandledRejection', (reason, promise) => {
        log('Unhandled Rejection at:', reason.stack || reason)
    })

    return new Promise(function (resolve) {
        axios.post(`${apiUrl}/api/backtest`, config, httpConfig).then((response) => {
            let market = response.data.market;
            let tradingAdvisor = response.data.tradingAdvisor;
            let strategyParameters = response.data.strategyParameters;
            let performanceReport = response.data.performanceReport;

            let resultCsvLine = [];

            if (empty(tradingAdvisor) || empty(performanceReport)) {
                log(chalk.red('No trades for:', chalk.dim(`${config.tradingAdvisor.method} ${config.watch.currency.toUpperCase()}/${config.watch.asset.toUpperCase()} ${config.tradingAdvisor.candleSize}/${config.tradingAdvisor.historySize} ${upperCaseFirst(config.watch.exchange)}`)));
                resolve();
            }
            else {
                successBacktestCounter++;

                resultCsvLine = [{
                    method: tradingAdvisor.method,
                    market_performance_percent: round(performanceReport.market),
                    relative_profit: round(performanceReport.relativeProfit),
                    profit: round(performanceReport.profit),
                    run_date: moment().utc().format('ll'),
                    run_time: moment().utc().format('LT'),
                    start_date: humanizeDate(performanceReport.startTime),
                    end_date: humanizeDate(performanceReport.endTime),
                    currency_pair: (market.currency + '/' + market.asset).toUpperCase(),
                    candle_size: tradingAdvisor.candleSize,
                    history_size: tradingAdvisor.historySize,
                    currency: market.currency.toUpperCase(),
                    asset: market.asset.toUpperCase(),
                    exchange: market.exchange,
                    timespan: performanceReport.timespan,
                    yearly_profit: round(performanceReport.relativeProfit),
                    yearly_profit_percent: round(performanceReport.yearlyProfit),
                    start_price: performanceReport.startPrice,
                    end_price: performanceReport.endPrice,
                    trades: performanceReport.trades,
                    start_balance: performanceReport.startBalance,
                    sharpe: round(performanceReport.sharpe, 3),
                    alpha: round(performanceReport.alpha, 3),
                    config: JSON.stringify(strategyParameters),
                    downside: round(performanceReport.downside, 3)
                }];

                terminalTable.push([
                    tradingAdvisor.method,
                    market.currency.toUpperCase(),
                    market.asset.toUpperCase(),
                    tradingAdvisor.candleSize,
                    tradingAdvisor.historySize,
                    market.exchange,
                    round(performanceReport.relativeProfit),
                    round(performanceReport.market)
                ])

                Promise.resolve()
                    .then(function () {
                        return csvWriter.writeRecords(resultCsvLine);
                    })
                    .then(() => {
                        log(chalk.green('Complete:', chalk.dim(`${config.tradingAdvisor.method} ${config.watch.currency.toUpperCase()}/${config.watch.asset.toUpperCase()} ${config.tradingAdvisor.candleSize}/${config.tradingAdvisor.historySize} ${upperCaseFirst(config.watch.exchange)}`)));
                        resolve();
                    });
            }
        }).catch(function (error) {
            log(error);
        })
    })
}

/*
* Format Date, example: November 2, 2018 2:34 PM
* */
function humanizeDate(date) {
    return moment(date).format('lll');
}

/*
* Round number
* */
function round(number, precision) {
    if (!precision) {
        precision = 2
    }

    return math.round(+number, precision);
}

function generateRange(start, end, step) {
    if (step && end) {
        let arr = math.range(start, end, step, true);

        return arr.map(function (number) {
            return number.toFixed(countDecimals(step))
        });
    }
    else {
        return math.range(start, end, 1, true);
    }
}

/*
* Automatically create-object if undefined with path
* */
function addProps(obj, arr, val) {
    if (typeof arr == 'string') {
        arr = arr.split(".");
    }

    obj[arr[0]] = obj[arr[0]] || {};

    var tmpObj = obj[arr[0]];

    if (arr.length > 1) {
        arr.shift();

        addProps(tmpObj, arr, val);
    }
    else {
        obj[arr[0]] = val;
    }

    return obj;
}

/*
* Count decimals of number
* */
function countDecimals(a) {
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
}

/*
* Check if type object is Matrix
* */
function isMatrix(v) {
    if (v) {
        return math.typeof(v) === 'Matrix';
    }
}