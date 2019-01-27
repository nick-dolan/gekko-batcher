require('events').EventEmitter.defaultMaxListeners = 1000;
const config = require('./config');
const util = require('./util');
const axios = require('axios');
const promiseLimit = require('promise-limit');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const chalk = require('chalk');
const log = console.log;
const {table} = require('table');
const fs = require('fs');
const combos = require('combos');
const _ = require('lodash');
const moment = require('moment');
const marky = require('marky');
const uniqid = require('uniqid');
const momentDurationFormatSetup = require("moment-duration-format");
const flatten = require('flat');

momentDurationFormatSetup(moment);

let backtestCounter = 0;
let successBacktestCounter = 0;
let completedBacktestCounter = 0;
let spentTime = 0;

let httpConfig = {
    headers: {'Content-Type': 'application/json'},
};

let method = config.method;
let shuffle = config.shuffle;
let gekkoPath = config.gekkoPath;
let apiUrl = config.apiUrl;
let tomlConfigPath = gekkoPath + 'config/strategies';
let candleSizes = config.candleSizes;
let historySizes = config.historySizes;
let tradingPairs = config.tradingPairs;
let dateranges = config.dateranges;
let parallelQueries = config.parallelQueries;

let flattenRanges = flatten(config.ranges);

let ranges = _.mapValues(flattenRanges, function (value) {
    if (_.includes(value, ':')) {
        let params = value.split(":");

        return util.generateRange(+params[0], +params[2], +params[1]);
    }
    else {
        return [value];
    }
});

const combinations = combos(_.mapValues(ranges, function (value) {
    if (util.isMatrix(value)) {
        return value._data;
    }
    else {
        return value;
    }
}));

let strategyConfigs = [];

_.forEach(combinations, function (item) {
    let obj = {};

    _.forOwn(item, function (value, key) {
        obj = _.set(obj, key, value);
    });

    strategyConfigs.push(obj);
})

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
                for (let d = 0; d < dateranges.length; d++) {
                    let option = {
                        candleSize: candleSizes[c],
                        historySize: historySizes[h],
                        tradingPair: {
                            exchange: tradingPairs[t][0],
                            currency: tradingPairs[t][1],
                            asset: tradingPairs[t][2]
                        },
                        paperTrader: config.paperTrader,
                        method: method,
                        daterange: dateranges[d]
                    };

                    option[method] = strategyConfigs[s];

                    options.push(option);
                }
            }
        }
    }
}

/*
* Show the number of combinations
* */
log(options.length + ' ' + 'combinations');
log(chalk.green(`Start time: ${moment().format('MMMM Do YYYY, h:mm:ss a')}`));

/*
* Collect all settings for batcher
* */
let allConfigs = [];

for (let o = 0; o < options.length; o++) {
    let backtestConfig = util.getConfig(options[o]);

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
        {id: 'paper_trader', title: 'Paper trader config'},
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
        log('Process has been finished. Spent time: ', moment.duration(spentTime / parallelQueries).format("d [days], h [hours], m [minutes], s [seconds]"));

        if (terminalTable.length > 100) {
            log('100 most profitale results:');
        }
        else {
            log('Results:');
        }

        terminalTable.unshift(tableHeaders);

        terminalTable.sort(function (a, b) {
            return b[6] > a[6] ? 1 : -1;
        });

        log(table(terminalTable.slice(0, 100), tableConfig));

        log(chalk.hex('#fafafa').bgHex('#00bf79')('See full results in results/bruteforce.csv'));
    }
    else {
        log(chalk.red('There are no any results'));
    }
});

function runBacktest(config) {
    backtestCounter++;

    let backtestId = backtestCounter + '_' + uniqid();
    let duration = 0;

    marky.mark(backtestId);

    log(chalk.cyan('Started:', chalk.dim(`${config.tradingAdvisor.method} ${config.watch.currency.toUpperCase()}/${config.watch.asset.toUpperCase()} ${config.tradingAdvisor.candleSize}/${config.tradingAdvisor.historySize} ${_.startCase(config.watch.exchange)}`)));

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

            if (_.isEmpty(tradingAdvisor) || _.isEmpty(performanceReport)) {
                log(chalk.red('No trades for:', chalk.dim(`${config.tradingAdvisor.method} ${config.watch.currency.toUpperCase()}/${config.watch.asset.toUpperCase()} ${config.tradingAdvisor.candleSize}/${config.tradingAdvisor.historySize} ${_.startCase(config.watch.exchange)}`)));

                completedBacktestCounter++;

                spentTime += marky.stop(backtestId).duration;

                util.countRemainingTime(completedBacktestCounter, options.length, spentTime);

                resolve();
            }
            else {
                successBacktestCounter++;

                resultCsvLine = [{
                    method: tradingAdvisor.method,
                    market_performance_percent: util.round(performanceReport.market, 3),
                    relative_profit: util.round(performanceReport.relativeProfit, 3),
                    profit: util.round(performanceReport.profit, 3),
                    run_date: moment().utc().format('ll'),
                    run_time: moment().utc().format('LT'),
                    start_date: util.humanizeDate(performanceReport.startTime),
                    end_date: util.humanizeDate(performanceReport.endTime),
                    currency_pair: (market.currency + '/' + market.asset).toUpperCase(),
                    candle_size: tradingAdvisor.candleSize,
                    history_size: tradingAdvisor.historySize,
                    currency: market.currency.toUpperCase(),
                    asset: market.asset.toUpperCase(),
                    exchange: market.exchange,
                    timespan: performanceReport.timespan,
                    yearly_profit: util.round(performanceReport.relativeProfit, 3),
                    yearly_profit_percent: util.round(performanceReport.yearlyProfit, 3),
                    start_price: performanceReport.startPrice,
                    end_price: performanceReport.endPrice,
                    trades: performanceReport.trades,
                    start_balance: performanceReport.startBalance,
                    sharpe: util.round(performanceReport.sharpe, 3),
                    alpha: util.round(performanceReport.alpha, 3),
                    config: JSON.stringify(strategyParameters),
                    paper_trader: JSON.stringify(config.paperTrader),
                    downside: util.round(performanceReport.downside, 3)
                }];

                terminalTable.push([
                    tradingAdvisor.method,
                    market.currency.toUpperCase(),
                    market.asset.toUpperCase(),
                    tradingAdvisor.candleSize,
                    tradingAdvisor.historySize,
                    market.exchange,
                    util.round(performanceReport.relativeProfit),
                    util.round(performanceReport.market)
                ])

                Promise.resolve()
                    .then(function () {
                        return csvWriter.writeRecords(resultCsvLine);
                    })
                    .then(() => {
                        log(chalk.green('Complete:', chalk.dim(`${config.tradingAdvisor.method} ${config.watch.currency.toUpperCase()}/${config.watch.asset.toUpperCase()} ${config.tradingAdvisor.candleSize}/${config.tradingAdvisor.historySize} ${_.startCase(config.watch.exchange)}`)));

                        completedBacktestCounter++;

                        spentTime += marky.stop(backtestId).duration;

                        util.countRemainingTime(completedBacktestCounter, options.length, spentTime);

                        resolve();
                    });
            }
        }).catch(function (error) {
            if (error.code === 'ECONNREFUSED') {
                log('Gekko isn\'t running probably. Go to Gekko\'s folder and type: node gekko --ui');

                process.exit(0);
            }
            if (error.response.status === 500) {
                log(chalk.red(chalk.dim(`Error for method: ${config.tradingAdvisor.method} ${config.watch.currency.toUpperCase()}/${config.watch.asset.toUpperCase()} ${config.tradingAdvisor.candleSize}/${config.tradingAdvisor.historySize} ${_.startCase(config.watch.exchange)}`)));
                log(error.response.data);
                log(error.message);
                log('See the Gekko logs to find out the reason')

                process.exit(0);
            }
            else {
                log(chalk.red(chalk.dim(`Error for method: ${config.tradingAdvisor.method} ${config.watch.currency.toUpperCase()}/${config.watch.asset.toUpperCase()} ${config.tradingAdvisor.candleSize}/${config.tradingAdvisor.historySize} ${_.startCase(config.watch.exchange)}`)));

                log(error.message);
            }
        })
    })
}