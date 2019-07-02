# Backtest tools for Gekko

CLI tool helps to put together testing and optimizing strategies that extend the  Gekko's Trading Bot capabilities – and thus you may get the most of it, and see what combinations were the best and the worst backed up by statistics.

The results appear in a CSV report file. It provides key statistics describing the overall performance of the selected strategies over the chosen historical timing of the simulation.

It uses [Gekko's API](https://gekko.wizb.it/docs/internals/server_api.html#POST-api-backtest), one gekko instance running required only.

![](https://user-images.githubusercontent.com/25667028/53367299-d0872800-3956-11e9-9e09-d291e3b6e851.gif)

#### Tools

- Batcher – batch backtest tool for multiple strategies and pairs.
- Bruteforce – run all possible parameter combinations for specific method with given ranges for strategy optimization.
- Importer – allow you to import multiple datasets thick and fast

#### You can set up multiple…

Strategies / Trading Pairs / Candle sizes / History sizes / Dateranges / Range of strategy config's parameters (BruteForce)

#### Features

- Ability to set up the priority of where to get method's config (be it TOML, gekko's config.js or gekko-batcher's config itself)
- Generating all possible combinations of configs for backtests and shuffle it
- Multithreading
- Exporting results to CSV file
- Evaluating approximately remaining time

#### Requirements

- Node.js
- [Gekko](https://github.com/askmike/gekko/releases) trading framework

## Before start

#### In Gekko's folder

1. `npm install` – first, you need to install dependencies.
2. Download all candles data you need via the importer.
3. `node gekko --ui` – start [Gekko](https://github.com/askmike/gekko) in ui mod.
4. `cp sample-config.js config.js` – just copy sample-config.js like this. Strategy settings will be taken from here.

Additional:

Increase `server.timeout` at `/gekko/web/server.js` to avoid a timeout error if the strategy runs for a long time. For example, this happens for small sized candles.

#### **In Batcher's folder**

1. `npm install`
2. `cp sample-config.js config.js` – don't forget to create config file as well.
3. Set up everything you need in `config.js` and you are ready to go.

## Start

After all the above you can start tools by running one of the following in your terminal:

`node batch -c config.js` – to start Batcher

`node bruteforce -c config.js` – to start Bruteforce

`node import -c config.js` –  to start Importer

---

You can find results in the results folder after backtests. Take a look of [Sample file output](https://github.com/nicolay-zlobin/gekko-batcher/blob/master/sample_results.csv)

:movie_camera: [Gekko Trading Bot - Gekko Batcher - YouTube](https://www.youtube.com/watch?v=RaIP44PQstw) – watch a video review of these tools.

:spiral_notepad: [RU] [Gekko-batcher — тестирование и оптимизация торговых стратегий](https://teoway.com/gekko-batcher-testirovanie-i-optimizatsiya-torgovyh-strategij/)

---

## Contributing

Forks and stars are highly welcome.

For bugs and feature requests, please [create an issue](https://github.com/nicolay-zlobin/gekko-batcher/issues/new).
