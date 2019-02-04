const log = console.log
const util = require('./core/util.js')
const configsGenerator = require(util.dirs().tools + '/configsGenerator')
const resultsHandler = require(util.dirs().core + '/resultsHandler')
const info = require(util.dirs().core + '/info')
const async = require('async')
const axios = require('axios')
const csv = require('fast-csv')
const fs = require('fs')
const _ = require('lodash')
const marky = require('marky')
const uniqid = require('uniqid')

util.createResultsFolder()
util.mode = 'batch'

let methodConfigs = configsGenerator.getAllMethodConfigs()
let combs = configsGenerator.generateAllBatchCombinations(methodConfigs)
let gekkoConfigs = configsGenerator.prepareAllConfigsForGekko(combs)

info.initMessage(gekkoConfigs.length)

const csvStream = csv.createWriteStream({ headers: true })
const writableStream = fs.createWriteStream('results/batchV2.csv')

csvStream.pipe(writableStream)

async.mapLimit(gekkoConfigs, util.config.parallelQueries, runBacktest, (err) => {
  if (err) throw err

  csvStream.end()

  info.finishMessage()
})

async function runBacktest (config) {
  info.startedBacktest(config)
  info.completedBacktests++

  let backtestId = info.completedBacktests + '_' + uniqid()

  marky.mark(backtestId)

  try {
    await axios.post(`${util.config.apiUrl}/api/backtest`, config).then((response) => {
      let row = {}

      let performanceReport = response.data.performanceReport

      if (!_.isEmpty(performanceReport)) {
        info.successfulBacktests++

        row = resultsHandler.prepareCsvRow(response.data, config)
        info.spentTime += marky.stop(backtestId).duration
        info.completeBacktest(config)

        csvStream.write(row)
      } else {
        info.failureBacktests++
        info.spentTime += marky.stop(backtestId).duration
        info.withoutTrades(config)
      }

      info.processInfo()
    })
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      util.die('Gekko isn\'t running probably. Go to Gekko\'s folder and type: node gekko --ui')
    } else if (err.response.status === 500) {
      log(err.response.data, err.message)
      log('See Gekko\'s logs to find out the reason')
    } else {
      log(err)
    }

    info.errorInMethod(config)
    info.failureBacktests++
    info.spentTime += marky.stop(backtestId).duration
  }
}
