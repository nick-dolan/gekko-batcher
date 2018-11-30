const fs = require('fs');
const toml = require('toml');

/*
* Helper functions
* */
const util = {
    getTOML: function (fileName) {
        let raw = fs.readFileSync(fileName);

        return toml.parse(raw);
    }
}

module.exports = util;