/* Math helpers */

const mathjs = require('mathjs')
const _ = require('lodash')

const math = {
  generateRange: function (start, end, step) {
    if (step && end) {
      let arr = mathjs.range(start, end, step, true)

      return arr.map(function (number) {
        return +number.toFixed(math.countDecimals(step))
      })
    } else {
      return mathjs.range(start, end, 1, true)
    }
  },
  countDecimals: function (number) {
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
  isMatrix: function (v) {
    if (v) {
      return mathjs.typeof(v) === 'Matrix'
    }
  }
}

module.exports = math
