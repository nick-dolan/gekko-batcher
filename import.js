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
const moment = require('moment')
const ProgressBar = require('ascii-progress')

/*
* Observable with Proxy inside for message listening
* */
let proxyMessage = { message: {} }

const importMessageObservable = new Observable(subscriber => {
  proxyMessage = new Proxy(proxyMessage, {
    set (target, propKey, value) {
      target[propKey] = value

      subscriber.next(value)

      return true
    }
  })
})

/*
* Init client for WebSocket
* */
let api = util.removeHttp(util.config.apiUrl)

const ws = new WebSocket(`ws://${api}/gekko_event`, '', {})

ws.on('error', function (err) {
  util.errorHandler(err)
})

ws.on('message', function incoming (data) {
  proxyMessage.message = JSON.parse(data)
})

ws.on('close', function close () {
  console.log('Disconnected')
})

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

    log('Number of imports:', readyConfigs.length)

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
* Start imports with given concurrency
* */
function asyncImportTasks (next) {
  async.mapLimit(readyConfigs, util.config.parallelQueries, asyncImports, (err) => {
    if (err) throw err

    log(chalk.green('All imports are complete'))

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

    await listenImports(startedImportID, config)
  } catch (err) {
    util.errorHandler(err)
  }
}

/*
* Request for import
* */
async function postImport (config) {
  return axios.post(`${util.config.apiUrl}/api/import`, config).then((response) => {
    return response.data
  })
}

/*
* Count progress of current import
* All parameters in UTC
* */
function countProgressOfImport (from, to, latest) {
  let timespan = to.diff(from)
  let fromEndMs = to.diff(latest)
  let current = timespan - fromEndMs

  return 100 * current / timespan
}

/*
* Subscribe and listen if our started import finished
* */
async function listenImports (currentImport, config) {
  return new Promise(
    (resolve) => {
      let from = moment.utc(config.importer.daterange.from)
      let to = moment.utc(config.importer.daterange.to)
      let bar = new ProgressBar({
        schema: ':bar',
        total: 100
      })
      let firstLaunch = true

      const msgSubscription = importMessageObservable.subscribe((message) => {
        if (message.import_id === currentImport.id) {
          if (firstLaunch && message.updates.done === true) {
            log(chalk.cyanBright(`Import of ${_.capitalize(config.watch.exchange)} ${config.watch.currency}/${config.watch.asset} started`))
            log(chalk.cyanBright(`From ${config.importer.daterange.from} to ${config.importer.daterange.to}`))

            bar.update(0.99)

            firstLaunch = false
          } else if (firstLaunch) {
            log(chalk.cyanBright(`Import of ${_.capitalize(config.watch.exchange)} ${config.watch.currency}/${config.watch.asset} started`))
            log(chalk.cyanBright(`From ${config.importer.daterange.from} to ${config.importer.daterange.to}`))
            firstLaunch = false
          }

          let latest = moment.utc(message.updates.latest)

          let progress = countProgressOfImport(from, to, latest)

          if (message.updates.done === true) {
            bar.update(1)

            msgSubscription.unsubscribe()
            resolve(currentImport)
          } else {
            bar.update(progress / 100)
          }
        }
      })
    }
  )
}

async.series([
  asyncScanTasks,
  asyncImportTasks
])
