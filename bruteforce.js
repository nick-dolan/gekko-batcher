const log = console.log
const util = require('./core/util.js')
const moment = require('moment')
const configsGenerator = require(util.dirs().tools + '/configsGenerator')
const resultsHandler = require(util.dirs().core + '/resultsHandler')
const chalk = require('chalk')
const _ = require('lodash')
const async = require('async')
const axios = require('axios')
const csv = require('fast-csv')
const fs = require('fs')

util.createResultsFolder()

let ranges = configsGenerator.generateRangesOfMethod()
let combs = configsGenerator.getAllCombinationsFromRanges(ranges)
let strategyConfigs = configsGenerator.generateAllBruteforceCombinations(combs)
let gekkoConfigs = configsGenerator.prepareAllConfigsForGekko(strategyConfigs)

log(gekkoConfigs.length + ' ' + 'combinations')
log(chalk.green(`Start time: ${moment().format('MMMM Do YYYY, h:mm:ss a')}`))

const csvStream = csv.createWriteStream({ headers: true })
const writableStream = fs.createWriteStream('results/bruteforceV2.csv')

writableStream.on('finish', () => {
  console.log('CSV DONE!')
})

csvStream.pipe(writableStream)

async.mapLimit(gekkoConfigs, 1, runBacktest, (err) => {
  if (err) throw err

  csvStream.end()
})

async function runBacktest (config) {
  try {
    await axios.post(`${util.config.apiUrl}/api/backtest`, config).then((response) => {
      log(response.data.market)
      log(response.data.performanceReport.profit)

      let row = resultsHandler.prepareCsvRow(response.data)

      csvStream.write(row)
    })
  } catch (err) {
    util.errorHandler(err)
  }
}
