const util = require('./core/util.js');

const config = util.getConfig();
const mode = util.backtestMode();

console.log(config);
console.log(mode);