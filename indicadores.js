

const Binance = require('node-binance-api');
const tulind = require('tulind');
const binance = new Binance().options({
  APIKEY: process.env.API_KEY,
  APISECRET: process.env.API_SECRET,
  verbose: true,
  test:true,
  urls: {
    base: 'https://testnet.binance.vision/api/',
    combineStream: 'wss://testnet.binance.vision/stream?streams=',
    stream: 'wss://testnet.binance.vision/ws/'
 }

});
/**
 * Función que calcula el RSI (fuerza relativa)
 * @param {any} chart historíco de las últimas 500 velas
 * @param {number} periodo periodo para calcular el RSI (14 por defecto)
 * @returns retorna un double con el valor del RSI
 */
 const calcularRSI = (chart, periodo = 14) => {
    chartKey = binance.slice(chart);
    let close = chartKey.map((tick, index) => chart[chartKey[index]].close);
    return new Promise((resolve) => {
      tulind.indicators.rsi.indicator([close], [periodo], (err, res) => {
        resolve(res[0].slice(-1)[0]);
      });
    });
  }
  /**
   * Función que calcula el EMA (media de las velas)
   * @param {any} chart historíco de las últimas 500 velas
   * @param {number} periodo periodo para calcular el EMA
   * @returns retorna un double con el valor del EMA
   */
  const calcularEMA = (chart, periodo) => {
    chartKey = binance.slice(chart);
    let close = chartKey.map((tick, index) => chart[chartKey[index]].close);
    return new Promise((resolve) => {
      tulind.indicators.ema.indicator([close], [periodo], (err, res) => {
        resolve(res[0].slice(-1)[0]);
      });
    });
  }
module.exports = {
    calcularRSI,
    calcularEMA
  };
  