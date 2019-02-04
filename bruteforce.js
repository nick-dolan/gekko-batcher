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
util.mode = 'bruteforce'

let ranges = configsGenerator.generateRangesOfMethod()
let combs = configsGenerator.getAllCombinationsFromRanges(ranges)
let strategyConfigs = configsGenerator.generateAllBruteforceCombinations(combs)
let gekkoConfigs = configsGenerator.prepareAllConfigsForGekko(strategyConfigs)

info.initMessage(gekkoConfigs.length)

const csvStream = csv.createWriteStream({ headers: true })
const writableStream = fs.createWriteStream('results/bruteforceV2.csv')

csvStream.pipe(writableStream)

async.mapLimit(gekkoConfigs, util.config.parallelQueries, runBacktest, (err) => {
  if (err) throw err

  csvStream.end()
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

        row = resultsHandler.prepareCsvRow(response.data)
        info.spentTime += marky.stop(backtestId).duration
        info.completeBacktest(config)

        csvStream.write(row)
      } else {
        info.failureBacktests++
        info.spentTime += marky.stop(backtestId).duration
        info.noTradesForBacktest(config)
      }

      info.processInfo()
    })
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      util.die('Gekko isn\'t running probably. Go to Gekko\'s folder and type: node gekko --ui')
    } else {
      log(err)
    }

    info.failureBacktests++
    info.spentTime += marky.stop(backtestId).duration
  }
}
