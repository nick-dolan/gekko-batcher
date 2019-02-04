const log = console.log
const util = require('./core/util.js')
const dirs = util.dirs()
const configsGenerator = require(dirs.tools + '/configsGenerator')
const moment = require('moment')
const chalk = require('chalk')
// const mode = util.backtestMode()
const _ = require('lodash')
const async = require('async')
const axios = require('axios')
const csv = require('fast-csv')
const fs = require('fs')
// util.createResultsFolder()
// const request = require('request')
// const math = require(dirs.core + '/math')

// Batcher
// let bm = configsGenerator.getAllMethodConfigs()
// let bo = configsGenerator.generateAllBatchCombinations(bm)
// let bf = configsGenerator.prepareAllConfigsForGekko(bo)

// if (mode === 'batch') {
//   _.noop()
// } else if (mode === 'bruteforce') {
// }

let r = configsGenerator.generateRangesOfMethod()
let cr = configsGenerator.getAllCombinationsFromRanges(r)
let c = configsGenerator.generateAllBruteforceCombinations(cr)
let allConfigs = configsGenerator.prepareAllConfigsForGekko(c)

log(allConfigs.length + ' ' + 'combinations')
log(chalk.green(`Start time: ${moment().format('MMMM Do YYYY, h:mm:ss a')}`))

const csvStream = csv.createWriteStream({ headers: true })
const writableStream = fs.createWriteStream('results/bruteforceV2.csv')

writableStream.on('finish', function () {
  console.log('DONE!')
})

csvStream.pipe(writableStream)

async.mapLimit(allConfigs, 1, runBacktest, (err) => {
  if (err) throw err

  csvStream.end()
})

async function runBacktest (config) {
  try {
    await axios.post(`${util.config.apiUrl}/api/backtest`, config).then((response) => {
      log(response.data.market)
      log(response.data.tradingAdvisor)
      log(response.data.performanceReport)

      csvStream.write({
        'Market performance (%)': response.data.market.exchange,
        'Strat performance (%)': response.data.market.currency
      })
    })
  } catch (err) {
    util.errorHandler(err)
  }
}
