const util = require('./core/util.js')
util.mode = 'import'
const log = console.log
const moment = require('moment')
const _ = require('lodash')
const axios = require('axios')
const async = require('async')
util.getConfig()
const WebSocket = require('ws')
const { Observable } = require('rxjs')
const chalk = require('chalk')

/*
* Convert dateranges to unix format
* */
util.config.dateranges = _.map(util.config.dateranges, (obj) => {
  return _.mapValues(obj, (date) => {
    return moment.utc(date, 'YYYY-MM-DD HH:mm').unix()
  })
})

/*
* Prepare configs
* */
let configs = []

_.each(util.config.tradingPairs, (pair) => {
  configs.push({
    exchange: pair[0],
    currency: pair[1].toUpperCase(),
    asset: pair[2].toUpperCase(),
    dateranges: util.config.dateranges
  })
})

/*
* Prepare config for Gekko's import request
* */
function prepareConfigForImport (config) {
  return {
    'watch': {
      'exchange': config.exchange,
      'currency': config.currency,
      'asset': config.asset
    },
    'importer': {
      'daterange': {
        'from': moment.utc(config.importFrom, 'X').format('YYYY-MM-DD HH:mm'),
        'to': moment.utc(config.importTo, 'X').format('YYYY-MM-DD HH:mm')
      }
    },
    'candleWriter': {
      'enabled': true
    }
  }
}

/*
* A preliminary check of datasets (compare given ranges with already downloaded)
* */
let checkRange = (importFrom, importTo, importedRanges) => {
  let updatedRange = {
    importFrom: importFrom,
    importTo: importTo,
    isRequired: true
  }

  _.each(importedRanges, (imported) => {
    /*
    * The specified range is within already imported data. No import is required
    * */
    if (importFrom >= imported.from && importTo <= imported.to) {
      updatedRange.isRequired = false
    }

    /*
    * If the already imported range is not within the specified range
    * */
    else if ((importFrom >= imported.to && importTo >= imported.from) || (importTo <= imported.from && importTo <= imported.to)) {
      _.noop()
    }
    /*
    * If the already imported data range overlaps the specified range from left
    * */
    else if (importFrom >= imported.from && importFrom < imported.to) {
      importFrom = imported.to

      updatedRange = {
        importFrom: importFrom,
        importTo: importTo,
        isRequired: true
      }

      log('New value "from" is:', importFrom, moment.utc(importFrom, 'X').format('YYYY-MM-DD HH:mm'))
    }
    /*
    * If the already imported data range overlaps the specified range from rigth
    * */
    else if (importTo > imported.from && importTo <= imported.to) {
      importTo = imported.from

      updatedRange = {
        importFrom: importFrom,
        importTo: importTo,
        isRequired: true
      }
      log('New value "to" is:', importTo, moment.utc(importTo, 'X').format('YYYY-MM-DD HH:mm'))
    }
  })

  return updatedRange
}

/*
* Prepare configs to import
* */
let readyConfigs = []

function asyncScanTasks (next) {
  async.mapLimit(configs, 3, asyncScans, (err) => {
    if (err) throw err

    log('Configs are ready!')

    next()
  })
}

/*
* All async scans tasks
* */
async function asyncScans (config) {
  try {
    let scan = await postScan(config)

    await updateConfigs(config, scan)
  } catch (error) {
    log(error)
  }
}

/*
* Request for scan
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

async function updateConfigs (config, scan) {
  _.each(config.dateranges, (toImport) => {
    let updatedRange = checkRange(toImport.from, toImport.to, scan)

    if (!updatedRange.isRequired) {
      log(`No import is required for specified range: ${config.exchange}, ${config.currency}/${config.asset}`)
      log(`From ${moment.utc(updatedRange.importFrom, 'X').format('YYYY-MM-DD HH:mm')} to ${moment.utc(updatedRange.importTo, 'X').format('YYYY-MM-DD HH:mm')}`)
    } else {
      let configForImport = prepareConfigForImport({
        exchange: config.exchange,
        currency: config.currency,
        asset: config.asset,
        importFrom: updatedRange.importFrom,
        importTo: updatedRange.importTo
      })

      readyConfigs.push(configForImport)
    }
  })
}

/*
* Set up new Observable with Proxy inside for
* ability to subscribe when import is complete
* */
let arr = []

const observable = new Observable(subscriber => {
  arr = new Proxy(arr, {
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

ws.on('message', function incoming (data) {
  let responce = JSON.parse(data)

  log(chalk.blue(`Import with ID ${responce.import_id} in progress`))

  // Push completed ID of backtests into the Proxy's array
  if (responce.updates && responce.updates.done === true) {
    arr.push(responce.import_id)
  }
})

/*
* Start imports with given concurrency
* */
function asyncImportTasks (next) {
  async.mapLimit(readyConfigs, 1, asyncImports, (err) => {
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
  } catch (error) {
    log(error)
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
      const subscription = observable.subscribe(value => {
        if (value.includes(currentImport.id)) {
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
