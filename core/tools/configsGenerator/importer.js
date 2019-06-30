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
        if (updatedRange.mutatedDate) {
          log(`The already imported data range overlaps: ${_.upperFirst(config.exchange)}, ${config.currency}/${config.asset}. Calculated new "${updatedRange.mutatedDate}".`)
        }

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
  * Subtract or add some hours
  * action: add or subtract
  * timeUnit: months, hours, days
  * output: unix timestamp
  * */
  mutateDate (unixTimestamp, action, timeUnit, value) {
    return moment.utc(unixTimestamp, 'X')[action](value, timeUnit).format('X')
  },
  /*
  * A preliminary check of datasets (compare given ranges with already downloaded)
  * */
  checkRange (importFrom, importTo, importedRanges) {
    let updatedRange = {
      importFrom: importFrom,
      importTo: importTo,
      isRequired: true,
      mutatedDate: ''
    }

    const now = moment().utc().format('X')

    if (importedRanges.length === 0) {
      updatedRange.importFrom = this.mutateDate(importFrom, 'subtract', 'hours', 2)
      updatedRange.importTo = this.mutateDate(importTo, 'add', 'hours', 2)
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
        updatedRange.importFrom = this.mutateDate(importFrom, 'subtract', 'hours', 2)
        updatedRange.importTo = this.mutateDate(importTo, 'add', 'hours', 2)
      }
      /*
      * If the already imported data range overlaps the specified range (from)
      *                            |-----------New request----------|
      *                            |xxxxx|
      * |~~~~~~~~Already imported~~~~~~~~|
      * */
      else if (importFrom >= imported.from && importFrom < imported.to) {
        importFrom = imported.to

        updatedRange.importFrom = this.mutateDate(importFrom, 'subtract', 'hours', 2)
        updatedRange.importTo = this.mutateDate(importTo, 'add', 'hours', 2)
        updatedRange.mutatedDate = 'from'
      }
      /*
      * If the already imported data range overlaps the specified range (to)
      * |-----------New request----------|
      *                            |xxxxx|
      *                            |~~~~~~~~Already imported~~~~~~~~|
      * */
      else if (importTo > imported.from && importTo <= imported.to) {
        importTo = imported.from

        updatedRange.importFrom = this.mutateDate(importFrom, 'subtract', 'hours', 2)
        updatedRange.importTo = this.mutateDate(importTo, 'add', 'hours', 2)
        updatedRange.mutatedDate = 'to'
      }
      /*
      * The already imported data will not affect the new
      * */
      else {
        updatedRange.importFrom = this.mutateDate(importFrom, 'subtract', 'hours', 2)
        updatedRange.importTo = this.mutateDate(importTo, 'add', 'hours', 2)
      }
    })

    // If importTo is bigger than now set now
    if (updatedRange.importTo > now) {
      updatedRange.importTo = now
    }

    return updatedRange
  }
}

module.exports = importer
