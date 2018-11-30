const fs = require('fs');
const toml = require('toml');
const math = require('mathjs');
const moment = require('moment');

/*
* Helper functions
* */
const util = {
    getTOML: function (fileName) {
        let raw = fs.readFileSync(fileName);

        return toml.parse(raw);
    },
    countDecimals: function (a) {
        if (!isFinite(a)) {
            return 0;
        }

        var e = 1,
            p = 0;

        while (Math.round(a * e) / e !== a) {
            e *= 10;
            p++;
        }

        return p;
    },
    round(number, precision) {
        if (!precision) {
            precision = 2
        }

        return math.round(+number, precision);
    },
    isMatrix: function (v) {
        if (v) {
            return math.typeof(v) === 'Matrix';
        }
    },
    // Automatically create-object with path if undefined
    addProps: function (obj, arr, val) {
        if (typeof arr == 'string') {
            arr = arr.split(".");
        }

        obj[arr[0]] = obj[arr[0]] || {};

        var tmpObj = obj[arr[0]];

        if (arr.length > 1) {
            arr.shift();

            this.addProps(tmpObj, arr, val);
        }
        else {
            obj[arr[0]] = val;
        }

        return obj;
    },
    // Format Date. Result: November 2, 2018 2:34 PM
    humanizeDate: function (date) {
        return moment(date).format('lll');
    },
    generateRange: function (start, end, step) {
        if (step && end) {
            let arr = math.range(start, end, step, true);

            return arr.map(function (number) {
                return number.toFixed(util.countDecimals(step))
            });

        }
        else {
            return math.range(start, end, 1, true);
        }
    }
}

module.exports = util;