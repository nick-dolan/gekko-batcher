# Backtest Batcher for Gekko

Batch backtest tool for Gekko.

`npm install`

Before start you need to set up basic settings in top of `index.js`.

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

Strategy settings will be taken from toml files.

You need to start Gekko in ui mode also. Go to folder with gekko and typ `node gekko --ui`.

Don't forget to set up `gekkoPath` folder path for gekko!

Then just type `node index` in terminal and see process.

### Sample file output

![image](https://user-images.githubusercontent.com/25667028/48713586-c3ed8800-ec21-11e8-8d78-7ff9adcec05e.png)
