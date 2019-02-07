const util = require('../util')
const math = require('../math')
const moment = require('moment')
const _ = require('lodash')

const resultsHandler = {
  findBiggestWinAndLoss (data) {
    let trades = this.balanceChange(data)

    let biggestWin = _.maxBy(trades, (trade) => {
      return trade.balanceChange
    })

    let biggestLoss = _.minBy(trades, (trade) => {
      return trade.balanceChange
    })

    return {
      biggestWin: biggestWin.balanceChange,
      biggestWinPercent: biggestWin.balanceChangePercent,
      biggestLoss: biggestLoss.balanceChange,
      biggestLossPercent: biggestLoss.balanceChangePercent
    }
  },
  balanceChange (data) {
    let startBalance = data.performanceReport.startBalance
    let trades = data.trades
    let tradesWithBalanceChange = []

    _.forEach(trades, function (trade, i) {
      let prevBalance = trades[i - 1] ? trades[i - 1].balance : startBalance

      trade.balanceChange = math.round(trade.balance - prevBalance, 4)
      trade.balanceChangePercent = math.percentDiff(prevBalance, trade.balance, true, 3)

      tradesWithBalanceChange.push(trade)
    })

    return tradesWithBalanceChange
  },
  countWinsAndLosses (data, allTrades) {
    let startBalance = data.performanceReport.startBalance
    let trades = data.trades

    let wins = 0
    let losses = 0

    _.forEach(data.trades, function (trade, i) {
      let prevBalance = trades[i - 1] ? trades[i - 1].balance : startBalance.startBalance

      trade.balance > prevBalance ? wins++ : losses++
    })

    return {
      wins: wins,
      winsPercent: math.ruleOfThree(allTrades, wins, 100, true),
      losses: losses,
      lossesPercent: math.ruleOfThree(allTrades, losses, 100, true)
    }
  },
  prepareCsvRow (data, config) {
    let market = data.market
    let tradingAdvisor = data.tradingAdvisor
    let strategyParameters = data.strategyParameters
    let performanceReport = data.performanceReport
    let allTrades = performanceReport.trades

    let winsAndLosses = this.countWinsAndLosses(data, allTrades)
    let biggestWinAndLoss = this.findBiggestWinAndLoss(data)

    let resultRow = {
      'Method': tradingAdvisor.method,
      'Market performance (%)': math.round(performanceReport.market, 3),
      'Strat performance (%)': math.round(performanceReport.relativeProfit, 3),
      'Profit': math.round(performanceReport.profit, 3),
      'Trades': performanceReport.trades,
      'Wins': winsAndLosses.wins,
      'Wins (%)': winsAndLosses.winsPercent,
      'Losses': winsAndLosses.losses,
      'Losses (%)': winsAndLosses.lossesPercent,
      'Biggest win': biggestWinAndLoss.biggestWin,
      'Biggest win (%)': biggestWinAndLoss.biggestWinPercent,
      'Biggest loss': biggestWinAndLoss.biggestLoss,
      'Biggest loss (%)': biggestWinAndLoss.biggestLossPercent,
      'Start balance': performanceReport.startBalance,
      'Final balance': performanceReport.balance,
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
