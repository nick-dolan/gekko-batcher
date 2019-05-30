require('events').EventEmitter.defaultMaxListeners = 1000
const util = require('./core/util.js')
const configsGenerator = require(util.dirs().tools + '/configsGenerator')
const resultsHandler = require(util.dirs().tools + '/resultsHandler')
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
let gekkoConfigs = configsGenerator.getAllBacktestRequestConfigs(strategyConfigs)
let fileName = util.generateFileName()

console.log('Method:', util.config.method)
info.initMessage(gekkoConfigs.length)

let csvStream
let writableStream

if (util.config.saveToCsv) {
  csvStream = csv.createWriteStream({ headers: true })
  writableStream = fs.createWriteStream(`${util.dirs().results}/${fileName}`)

  csvStream.pipe(writableStream)
}

async.mapLimit(gekkoConfigs, util.config.parallelQueries, runBacktest, (err) => {
  if (err) throw err

  if (util.config.saveToCsv) {
    csvStream.end()
  }

  info.finishMessage(fileName)
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

        if (util.config.saveToCsv) {
          row = resultsHandler.prepareCsvRow(response.data)
          csvStream.write(row)
        }

        info.spentTime += marky.stop(backtestId).duration
        info.completeBacktest(config)
      } else {
        info.failureBacktests++
        info.spentTime += marky.stop(backtestId).duration
        info.withoutTrades(config)
      }

      info.processInfo()
    })
  } catch (err) {
    util.errorHandler(err)

    info.errorInMethod(config)
    info.failureBacktests++
    info.spentTime += marky.stop(backtestId).duration
  }
}
