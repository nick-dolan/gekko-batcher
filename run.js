const util = require('./core/util.js')
const dirs = util.dirs()
const configsGenerator = require(dirs.tools + '/configsGenerator')
const math = require(dirs.core + '/math')

const mode = util.backtestMode()
const log = console.log

// Bruteforce
let r = configsGenerator.generateRangesOfMethod()
let cr = configsGenerator.getAllCombinationsFromRanges(r)
let c = configsGenerator.generateAllBruteforceCombinations(cr)
let f = configsGenerator.prepareAllConfigsForGekko(c)

// Batcher
let bm = configsGenerator.getAllMethodConfigs()
let bo = configsGenerator.generateAllBatchCombinations(bm)
let bf = configsGenerator.prepareAllConfigsForGekko(bo)

log(f[0])

// if (mode === 'batch') {
// }
// else if (mode === 'bruteforce') {
// }
