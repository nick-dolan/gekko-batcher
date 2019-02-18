const _ = require('lodash')
const moment = require('moment')
const util = require('../../util')
const config = util.getConfig()
const log = console.log

const importer = {
  /*
  * Prepare config for Gekko's import request
  * */
  getImportRequestConfig (config) {
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
  },
  /*
  * Generate all configs from given params
  * */
  getConfigs () {
    // Convert given dateranges to unix format
    config.dateranges = _.map(config.dateranges, (obj) => {
      return _.mapValues(obj, (date) => {
        return moment.utc(date, 'YYYY-MM-DD HH:mm').unix()
      })
    })

    let configs = []

    _.each(util.config.tradingPairs, (pair) => {
      configs.push({
        exchange: pair[0],
        currency: pair[1].toUpperCase(),
        asset: pair[2].toUpperCase(),
        dateranges: config.dateranges
      })
    })

    return configs
  },
  /*
  *  Check ranges with already imported, get ready configs for further import
  * */
  updateConfig (config, scan) {
    let readyConfig = []

    _.each(config.dateranges, (toImport) => {
      let updatedRange = this.checkRange(toImport.from, toImport.to, scan)

      if (!updatedRange.isRequired) {
        log(`No import is required for specified range: ${config.exchange}, ${config.currency}/${config.asset}`)
        log(`From ${moment.utc(updatedRange.importFrom, 'X').format('YYYY-MM-DD HH:mm')} to ${moment.utc(updatedRange.importTo, 'X').format('YYYY-MM-DD HH:mm')}`)
      } else {
        let configForImport = this.getImportRequestConfig({
          exchange: config.exchange,
          currency: config.currency,
          asset: config.asset,
          importFrom: updatedRange.importFrom,
          importTo: updatedRange.importTo
        })

        readyConfig.push(configForImport)
      }
    })

    return readyConfig
  },
  /*
  * A preliminary check of datasets (compare given ranges with already downloaded)
  * */
  checkRange (importFrom, importTo, importedRanges) {
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

        log('New value "from" is:', moment.utc(importFrom, 'X').format('YYYY-MM-DD HH:mm'))
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
        log('New value "to" is:', moment.utc(importTo, 'X').format('YYYY-MM-DD HH:mm'))
      }
    })

    return updatedRange
  }
}

module.exports = importer
