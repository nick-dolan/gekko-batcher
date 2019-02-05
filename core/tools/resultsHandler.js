const util = require('../util')
const math = require('../math')
const moment = require('moment')

const resultsHandler = {
  prepareCsvRow (results, config) {
    let market = results.market
    let tradingAdvisor = results.tradingAdvisor
    let strategyParameters = results.strategyParameters
    let performanceReport = results.performanceReport

    let resultRow = {
      'Method': tradingAdvisor.method,
      'Market performance (%)': math.round(performanceReport.market, 3),
      'Strat performance (%)': math.round(performanceReport.relativeProfit, 3),
      'Profit': math.round(performanceReport.profit, 3),
      'Trades': performanceReport.trades,
      'Sharpe': math.round(performanceReport.sharpe, 3),
      'Alpha': math.round(performanceReport.alpha, 3),
      'Candle size': tradingAdvisor.candleSize,
      'History size': tradingAdvisor.historySize,
      'Timespan': performanceReport.timespan,
      'Run date': moment().utc().format('ll'),
      'Run time': moment().utc().format('LT'),
      'Start date': moment(performanceReport.startTime).format('lll'),
      'End date': moment(performanceReport.endTime).format('lll'),
      'Currency pair': (market.currency + '/' + market.asset).toUpperCase(),
      'Currency': market.currency.toUpperCase(),
      'Asset': market.asset.toUpperCase(),
      'Exchange': market.exchange,
      'Yearly profit': math.round(performanceReport.relativeProfit),
      'Yearly profit (%)': math.round(performanceReport.yearlyProfit),
      'Start price': performanceReport.startPrice,
      'End price': performanceReport.endPrice,
      'Start balance': performanceReport.startBalance,
      'Final balance': performanceReport.balance,
      'Config': JSON.stringify(strategyParameters),
      'Fee maker': util.config.paperTrader.feeMaker,
      'Fee taker': util.config.paperTrader.feeTaker,
      'Slippage': util.config.paperTrader.slippage,
      'Simulation balance': `Currency: ${util.config.paperTrader.simulationBalance.currency}, Asset: ${util.config.paperTrader.simulationBalance.asset}`,
      'Downside': math.round(performanceReport.downside, 3)
    }

    if (util.mode === 'batch') {
      resultRow['Method\'s settings location'] = config.configLocation || 'no config'
    }

    return resultRow
  }
}

module.exports = resultsHandler
