# Backtest tools for Gekko

CLI tool helps to put together testing and optimizing strategies that extend the  Gekko's Trading Bot capabilities – and thus you may get the most of it, and see what combinations were the best and the worst, backed up by statistics.

The results appear in a CSV report file. It provides key statistics describing the overall performance of the selected strategies over the chosen historical timing of the simulation.

It uses [Gekko's API](https://gekko.wizb.it/docs/internals/server_api.html#POST-api-backtest), one gekko instance running required only.

#### You can set up multiple…

- Candle sizes
- HistorySizes
- Strategies
- Trading Pairs
- Range of strategy config's paraments (BruteForce)
- Dateranges

#### Features

- Ability to set up the priority of where to get method's config (be it TOML, gekko's config.js or gekko-batcher's config itself)
- Generating all possible combinations of configs for backtests and shuffle it
- Multithreading
- Exporting results to CSV file
- Evaluating approximately remaining time

#### Requirements

- Node.js
- [Gekko](https://github.com/askmike/gekko/releases) trading framework

### Before start

First, you need to install dependencies: `npm install`. Then start [Gekko](https://github.com/askmike/gekko) in ui mod. Go to folder with gekko and type `node gekko --ui`.

Don't forget to create **config** file. Just copy sample-config.js like this: `cp sample-config.js config.js`. 

Set up everything you need in `config.js`. 

Set debug false at `/gekko/web/routes/baseConfig.js` for better performance.

Increase `server.timeout` at `/gekko/web/server.js` to avoid a timeout error if the strategy runs for a long time. For example, this happens for small sized candles.

## Backtest Batcher 

Batch backtest tool for multiple strategies and pairs.

#### Usage

Set up settings in `config.js` and you are ready to go. Type `node batcher` in terminal and see process.

You can find csv output in results folder: `/results/batch.csv`

## Bruteforce Searcher

Run all possible parameter combinations for specific method with given ranges for strategy optimization.

#### Usage

In addition to other settings, specify `method` you want (`config.method = 'YourMethod';`) and `ranges` in your config file. Example:

```js
config.ranges = {
    interval: '8:1:10',
    thresholds: {
        low: '24:1:26',
        high: '70:1:80',
        persistence: 1
    }
};
```

The name of the property for range must match the property name in method's config. 

 Type `node bruteforce` in terminal and see process. You can find csv output in results folder: `/results/bruteforce.csv`

### [Sample file output](https://github.com/nicolay-zlobin/gekko-batcher/blob/master/sample_results.csv)

![image](https://user-images.githubusercontent.com/25667028/48713586-c3ed8800-ec21-11e8-8d78-7ff9adcec05e.png)
