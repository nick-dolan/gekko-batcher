# Backtest tools for Gekko

### Berore start

Firstly you need to install dependencies:  `npm install`. Then start Gekko in ui mod. Go to folder with gekko and type `node gekko --ui`.

Don't forget to create config file from sample-config.js: `cp sample-config.js config.js`

## Backtest Batcher 

Batch backtest tool for Gekko.

### Usage

Before start you need to set up basic settings in top of  `batcher.js`.  Strategy settings will be taken from toml files. Don't forget to set up `gekkoPath` path for gekko!

Example:

```js
let gekkoPath = '../gekko/';
let candleSizes = [45, 60, 75];
let historySizes = [10, 15];
let tradingPairs = [["poloniex", "eth", "zec"], ["poloniex", "eth", "bch"]];
let methods = ['RSI', 'MACD', 'StochRSI'];
let daterange = {
    from: '2018-03-19T17:16:00Z',
    to: '2018-06-19T17:16:00Z'
};
let parallelQueries = 3;
```

Then just type `node batcher` in terminal and see process.

You can find csv output in results folder: `/results/results.csv`

## Bruteforce Seacher

Run all possible parameter combinations for specific method with given ranges.

### Usage

First steps are the same as for Backtest Batcher. Two things you need to set up are specify `method` and `ranges`. The name of the property for range must match the property name in method's config. Place properties of method linearly. Example:

```js
let method = 'RSI';

let ranges = {
    interval: generateRange(12, 14),
    low: generateRange(28, 30),
    high: generateRange(68, 71),
    persistence: generateRange(1, 2, 0.5)
};
```



### [Sample file output](https://github.com/nicolay-zlobin/gekko-batcher/blob/master/sample_results.csv)

![image](https://user-images.githubusercontent.com/25667028/48713586-c3ed8800-ec21-11e8-8d78-7ff9adcec05e.png)
