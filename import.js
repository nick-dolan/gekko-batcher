const util = require('./core/util.js')
util.mode = 'import'
const log = console.log
const _ = require('lodash')
const axios = require('axios')
const async = require('async')
const WebSocket = require('ws')
const { Observable } = require('rxjs')
const chalk = require('chalk')
const configsGenerator = require(util.dirs().tools + '/configsGenerator')

/*
* Get configs
* */
let configs = configsGenerator.getConfigs()

/*
* Prepare configs to import
* */
let readyConfigs = []

function asyncScanTasks (next) {
  async.mapLimit(configs, 3, asyncScans, (err) => {
    if (err) throw err

    log('Number of imports', readyConfigs.length)

    next()
  })
}

/*
* All async tasks for scan
* */
async function asyncScans (config) {
  try {
    let scan = await postScan(config)

    let updatedConfig = configsGenerator.updateConfig(config, scan)

    readyConfigs = _.concat(readyConfigs, updatedConfig)
  } catch (err) {
    util.errorHandler(err)
  }
}

/*
* API Scan request
* */
async function postScan (config) {
  let request = {
    'watch': {
      'exchange': config.exchange,
      'currency': config.currency,
      'asset': config.asset
    }
  }

  return axios.post(`${util.config.apiUrl}/api/scan`, request).then((response) => {
    return response.data
  })
}

/*
* Set up new Observable with Proxy inside for
* ability to subscribe when import is complete
* */
let completedImports = []

const observable = new Observable(subscriber => {
  completedImports = new Proxy(completedImports, {
    set: function (target, key, value) {
      if (key === 'length') {
        subscriber.next(target)
      }

      target[key] = value

      return true
    }
  })
})

/*
* Init client for WebSocket
* */
const ws = new WebSocket(`ws://localhost:3000/gekko_event`, '', {})

ws.on('error', function (err) {
  util.errorHandler(err)
})

ws.on('message', function incoming (data) {
  let responce = JSON.parse(data)

  log(chalk.blue(`Import with ID ${responce.import_id} in progress`))

  // Push completed ID of backtests into the Proxy's array
  if (responce.updates && responce.updates.done === true) {
    completedImports.push(responce.import_id)
  }
})

ws.on('close', function close () {
  console.log('Disconnected')
})

/*
* Start imports with given concurrency
* */
function asyncImportTasks (next) {
  async.mapLimit(readyConfigs, util.config.parallelQueries, asyncImports, (err) => {
    if (err) throw err

    log('All imports are complete')

    ws.close(1000, 'All imports are done')

    next()
  })
}

/*
* All async import tasks
* */
async function asyncImports (config) {
  try {
    let startedImportID = await postImport(config)

    let completedImport = await listenImports(startedImportID)

    log(chalk.green(`Import with ID ${completedImport.id} completed`))
  } catch (err) {
    util.errorHandler(err)
  }
}

/*
* Request for import
* */
async function postImport (config) {
  return axios.post(`${util.config.apiUrl}/api/import`, config).then((response) => {
    log(chalk.cyanBright(`Import ${response.data.watch.exchange} ${response.data.watch.currency}/${response.data.watch.asset} started`))
    log(chalk.cyanBright(`From ${response.data.from} to ${response.data.to} ID: ${response.data.id}`))

    return response.data
  })
}

/*
* Subscribe and listen if our started import finished
* */
async function listenImports (currentImport) {
  return new Promise(
    (resolve, reject) => {
      const subscription = observable.subscribe(comletedImports => {
        if (_.includes(comletedImports, currentImport.id)) {
          subscription.unsubscribe()

          resolve(currentImport)
        }
      })
    }
  )
}

async.series([
  asyncScanTasks,
  asyncImportTasks
])
