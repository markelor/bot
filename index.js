
require('dotenv').config;
const Binance = require('node-binance-api');
const tulind = require('tulind');
const binance = new Binance().options({
  APIKEY: process.env.API_KEY,
  APISECRET: process.env.API_SECRET
});
/**
 * 
 * @param {*} open 
 * @param {*} close 
 * @returns 
 */
const esVelaAlcista = (open, close) => {
  if (open < close) {
    return true
  } else if (open > close) {
    return false;
  }

}
/**
 * 
 * @param {*} open 
 * @param {*} high 
 * @param {*} low 
 * @param {*} close 
 * @returns 
 */
const esMartilloAlcistaPositivo = (open, high, low, close) => {
  if (esVelaAlcista(open, close) && (open - low) > ((close - open) * 3) && (high - close) < ((close - open) * 2)) {
    return true
  } else {
    return false;
  }

}
/**
 * 
 * @param {*} open 
 * @param {*} high 
 * @param {*} low 
 * @param {*} close 
 * @returns 
 */
const esMartilloAlcistaNegativo = (open, high, low, close) => {
  if (!esVelaAlcista(open, close) && (close - low) > ((open - close) * 3) && (high - open) < ((open - close) * 2)) {
    return true
  } else {
    return false;
  }

}
/**
 * 
 * @param {*} open 
 * @param {*} high 
 * @param {*} low 
 * @param {*} close 
 * @returns 
 */

const esMartilloBajistaNegativo = (open, high, low, close) => {
  if (!esVelaAlcista(open, close) && (high - open) > ((open - close) * 3) && (close - low) < ((open - close) * 2)) {
    return true
  } else {
    return false;
  }

}
/**
 * 
 * @param {*} open 
 * @param {*} high 
 * @param {*} low 
 * @param {*} close 
 * @returns 
 */
const esMartilloBajistaPositivo = (open, high, low, close) => {
  if (esVelaAlcista(open, close) && (high - close) > ((close - open) * 3) && (open - low) < ((close - open) * 2)) {
    return true
  } else {
    return false;
  }

}
/**
 * 
 * @param {*} high 
 * @param {*} low 
 * @returns 
 */
const porcentajeMovimoentoVela = (high, low) => {
  return (high / (high + low)) / 100;
}
/**
 * 
 * @param {*} chart 
 * @returns 
 */
const calcularRSI = (chart) => {
  chartKey = binance.slice(chart);
  let close = chartKey.map((tick, index) => chart[chartKey[index]].close);
  return new Promise((resolve) => {
    tulind.indicators.rsi.indicator([close], [14], (err, res) => {
      resolve(res[0].slice(-1)[0]);
    });
  });
}
/**
 * 
 * @param {*} chart 
 * @param {*} periodo 
 * @returns 
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
/**
 * Formula: Apalancamiento=riesgo/(porcentajeMovimientoVela*capitalOperacion)
 * @param {double} riesgo lo que el usuario está dispuesto a perder, normalmente 1%
 * @param {double} porcentajeMovimoentoVela el porcentaje que se ha movido la vela
 * @param {double} capitalOperacion el capital que se pondra para coger una posición (isolated)
 */

const calcularApalancamiento = (riesgo, porcentajeMovimoentoVela, capitalOperacion) => {
  return riesgo / (porcentajeMovimoentoVela * capitalOperacion);

}




binance.websockets.chart("BTCUSDT", "1m", async (symbol, interval, chart) => {
  let tick = binance.last(chart);
  const lastCandle = chart[tick];

  //console.info(chart);
  // Optionally convert 'chart' object to array:
  // let ohlc = binance.ohlc(chart);
  // console.info(symbol, ohlc);

  if (chart[tick].isFinal === undefined) {
    /*console.info(symbol + " last open: " + lastCandle.open)
    console.info(symbol + " last high: " + lastCandle.high)
    console.info(symbol + " last low: " + lastCandle.low)
    console.info(symbol + " last close: " + lastCandle.close)
*/
    /* console.log('------------------------------------------------------------');
     console.log(new Date().getMinutes());
     console.log(new Date().getSeconds());
     console.info(symbol + " alcista: " + esVelaAlcista(lastCandle.open, lastCandle.close))
     console.info(symbol + " martillo alcista positivo: " + esMartilloAlcistaPositivo(lastCandle.open, lastCandle.high, lastCandle.low, lastCandle.close))
     console.info(symbol + " martillo alcista negativo: " + esMartilloAlcistaNegativo(lastCandle.open, lastCandle.high, lastCandle.low, lastCandle.close))
     console.info(symbol + " martillo bajista negativo: " + esMartilloBajistaNegativo(lastCandle.open, lastCandle.high, lastCandle.low, lastCandle.close))
     console.info(symbol + " martillo bajista positivo: " + esMartilloBajistaPositivo(lastCandle.open, lastCandle.high, lastCandle.low, lastCandle.close))*/
    const rsi = await calcularRSI(chart);

    console.info(rsi);




  }

});
//await binance.futuresBuy('BTCUSDT', 0.1, 8222)

  // Periods: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M
/*binance.websockets.candlesticks(['BNBBTC'], "1m", (candlesticks) => {
    let { e:eventType, E:eventTime, s:symbol, k:ticks } = candlesticks;
    let { o:open, h:high, l:low, c:close, v:volume, n:trades, i:interval, x:isFinal, q:quoteVolume, V:buyVolume, Q:quoteBuyVolume } = ticks;
    console.info( "------------------------------------------------------------------------------------------------------");
    console.log(new Date().getMinutes());
    console.log(new Date().getSeconds());
    console.info(symbol+" "+interval+" candlestick update");
    console.info("open: "+open);
    console.info("high: "+high);
    console.info("low: "+low);
    console.info("close: "+close);
    console.info("volume: "+volume);
    console.info("isFinal: "+isFinal);
  });*/
