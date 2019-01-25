const program = require('commander');
const fs = require('fs');

const util = {
    getConfig() {
        if (!program.config) {
            util.die('Please specify a config file.');
        }

        if (!fs.existsSync(util.dirs().batcher + program.config)) {
            util.die('Cannot find the specified config file.');
        }

        return require(util.dirs().batcher + program.config);
    },
    die: function (message) {
        var log = console.log.bind(console);

        if (message) {
            log(`\n ERROR: ${message}\n`);
        }

        process.exit(1);
    },
    dirs: function () {
        var ROOT = __dirname + '/../';

        return {
            batcher: ROOT,
            core: ROOT + 'core/',
            tools: ROOT + 'core/tools/',
        }
    },
    backtestMode: function () {
        if (program['batch']) {
            return 'batch';
        }
        else if (program['bruteforce']) {
            return 'bruteforce';
        }
        else {
            util.die('Unknown mode');
        }
    }
}

program
    .version('0.1.0')
    .option('-c, --config <file>', 'Config file')
    .option('-b, --batch', 'Batch mode')
    .option('-f, --bruteforce', 'Bruteforce mode')
    .parse(process.argv);

module.exports = util;