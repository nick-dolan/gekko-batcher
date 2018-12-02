const fs = require('fs');
const _ = require('lodash');
const toml = require('toml');
const math = require('mathjs');
const moment = require('moment');
const config = require('./config');

const tomlConfigPath = config.gekkoPath + 'config/strategies';
let gekkoConfig = {};

if (fs.existsSync(config.gekkoPath + 'config.js')) {
    gekkoConfig = require(config.gekkoPath + 'config.js');
}

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
    },
    getMethodSettingsByLocation: function (name, location) {
        if (location === 'batcher') {
            if (!_.isEmpty(config[name])) {
                return config[name];
            }
        }
        else if (location === 'gekko') {
            if (!_.isEmpty(gekkoConfig[name])) {
                return gekkoConfig[name];
            }
        }
        else if (location === 'gekko-toml') {
            return util.getTOML(`${tomlConfigPath}/${name}.toml`);
        }
        else {
            console.log('There is no such config\'s location as ' + location);
        }
    },
    getMethodSettingsByPriority: function (name, locations) {
        let result = {};

        _.forEach(locations, function (location) {
            let config = util.getMethodSettingsByLocation(name, location);

            if (!_.isEmpty(config)) {
                result = {
                    location: location,
                    settings: config
                }

                return false;
            }
        })

        return result;
    }
}

module.exports = util;