/* Math helpers */

const mathjs = require('mathjs')
const _ = require('lodash')

const math = {
  generateRange (start, end, step) {
    if (step && end) {
      let arr = mathjs.range(start, end, step, true)

      return arr.map(function (number) {
        return +number.toFixed(math.countDecimals(step))
      })
    } else {
      return mathjs.range(start, end, 1, true)
    }
  },
  countDecimals (number) {
    if (!_.isFinite(number)) {
      return 0
    }

    let e = 1
    let p = 0

    while (_.round(number * e) / e !== number) {
      e *= 10
      p++
    }

    return p
  },
  round (number, precision) {
    if (!precision) {
      precision = 2
    }

    return _.round(+number, precision)
  },
  isMatrix (v) {
    if (v) {
      return mathjs.typeof(v) === 'Matrix'
    }
  },
  ruleOfThree (had, got, have, round = false, precision = 2) {
    let result = +have * +got / +had

    return round ? math.round(result, precision) : result
  },
  percentDiff (base, peak, round = false, precision = 2) {
    const diff = (peak - base) / base * 100

    return round ? math.round(diff, precision) : diff
  }
}

module.exports = math
