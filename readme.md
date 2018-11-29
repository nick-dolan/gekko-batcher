# Backtest tools for Gekko

### Before start

Firstly you need to install dependencies:  `npm install`. Then start Gekko in ui mod. Go to folder with gekko and type `node gekko --ui`.

Don't forget to create config file from sample-config.js: `cp sample-config.js config.js`. 

Method's settings will be taken from toml files.

## Backtest Batcher 

Batch backtest tool for Gekko.

### Usage

Type `node batcher` in terminal and see process.

You can find csv output in results folder: `/results/batch.csv`

## Bruteforce Seacher

Run all possible parameter combinations for specific method with given ranges.

### Usage

First steps are the same as for Backtest Batcher. Two things you need to set up `method` and `ranges` in your config file. The name of the property for range must match the property name in method's config. Place properties of method linearly.

You can find csv output in results folder: `/results/bruteforce.csv`

### [Sample file output](https://github.com/nicolay-zlobin/gekko-batcher/blob/master/sample_results.csv)

![image](https://user-images.githubusercontent.com/25667028/48713586-c3ed8800-ec21-11e8-8d78-7ff9adcec05e.png)
