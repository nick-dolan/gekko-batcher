const util = require('../core/util.js')
const moment = require('moment')
const momentDurationFormatSetup = require('moment-duration-format')
const chalk = require('chalk')
const log = console.log
const _ = require('lodash')

momentDurationFormatSetup(moment)

const info = {
  spentTime: 0,
  completedBacktests: 0,
  successfulBacktests: 0,
  failureBacktests: 0,
  allCombinations: 0,
  initMessage (allCombinations) {
    this.allCombinations = allCombinations

    log(this.allCombinations + ' ' + 'combinations')
    log(chalk.green(`Start time: ${moment().format('MMMM Do YYYY, h:mm:ss a')}`))
  },
  completeBacktest (config) {
    log(chalk.green('Completed:', chalk.dim(`${config.tradingAdvisor.method} ${config.watch.currency.toUpperCase()}/${config.watch.asset.toUpperCase()} ${config.tradingAdvisor.candleSize}/${config.tradingAdvisor.historySize} ${_.startCase(config.watch.exchange)}`)))
  },
  startedBacktest (config) {
    log(chalk.cyan('Started:', chalk.dim(`${config.tradingAdvisor.method} ${config.watch.currency.toUpperCase()}/${config.watch.asset.toUpperCase()} ${config.tradingAdvisor.candleSize}/${config.tradingAdvisor.historySize} ${_.startCase(config.watch.exchange)}`)))
  },
  errorInMethod (config) {
    log(chalk.redBright(chalk.dim(`Error in method: ${config.tradingAdvisor.method} ${config.watch.currency.toUpperCase()}/${config.watch.asset.toUpperCase()} ${config.tradingAdvisor.candleSize}/${config.tradingAdvisor.historySize} ${_.startCase(config.watch.exchange)}`)))
  },
  withoutTrades (config) {
    log(chalk.gray('No trades for:', chalk.dim(`${config.tradingAdvisor.method} ${config.watch.currency.toUpperCase()}/${config.watch.asset.toUpperCase()} ${config.tradingAdvisor.candleSize}/${config.tradingAdvisor.historySize} ${_.startCase(config.watch.exchange)}`)))
  },
  finishMessage () {
    log('Process has been finished. Spent time:', moment.duration(this.spentTime / util.config.parallelQueries).format('d [days], h [hours], m [minutes], s [seconds]'))
  },
  processInfo () {
    let step = 0

    if (this.allCombinations < 500) {
      step = 10
    } else {
      step = 100
    }

    if (this.completedBacktests % step === 0) {
      let time = util.countTime(this.allCombinations, this.completedBacktests, this.spentTime, step)

      log('Spent time:', moment.duration(time.spent).format('d [days], h [hours], m [minutes], s [seconds]'))
      log('Approximately remaining time:', `${moment.duration(time.remaining).humanize()}`)
      log('Remaining backtests:', this.allCombinations - this.completedBacktests)
      log('Completed backtests:', this.completedBacktests)
    }
  }
}

module.exports = info
