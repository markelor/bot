
require('dotenv').config;
const Binance = require('node-binance-api');
const binance = new Binance().options({
  APIKEY: process.env.API_KEY,
  APISECRET: process.env.API_SECRET
});
const vela = require("./vela");
const indicadores = require("./indicadores");

/**
 * Función que calcula el apalancamiento que debemos tomar
 * Formula: Apalancamiento=riesgo/(porcentajeMovimientoVela*capitalOperacion)
 * @param {float} riesgo lo que el usuario está dispuesto a perder, normalmente 1%
 * @param {float} porcentajeMovimoentoVela el porcentaje que se ha movido la vela
 * @param {float} capitalOperacion el capital que se pondra para coger una posición (isolated)
 */

const calcularApalancamiento = (riesgo, porcentajeMovimoentoVela, capitalOperacion) => {
  return riesgo / (porcentajeMovimoentoVela * capitalOperacion);

}


binance.websockets.chart("BTCUSDT", "1m", async (symbol, interval, chart) => {
  let tick = binance.last(chart);
  const lastCandle = chart[tick];


  if (chart[tick].isFinal === undefined) {
     console.log('------------------------------------------------------------');
     console.log(new Date().getMinutes());
     console.log(new Date().getSeconds());
     console.info(symbol + " alcista: " + vela.esVelaAlcista(parseFloat(lastCandle.open), parseFloat(lastCandle.close)))
     console.info(symbol + " martillo alcista positivo: " + vela.esMartilloAlcistaPositivo(parseFloat(lastCandle.open), parseFloat(lastCandle.high), parseFloat(lastCandle.low), parseFloat(lastCandle.close)));
     console.info(symbol + " martillo alcista negativo: " + vela.esMartilloAlcistaPositivo(parseFloat(lastCandle.open), parseFloat(lastCandle.high), parseFloat(lastCandle.low), parseFloat(lastCandle.close)));
     console.info(symbol + " martillo bajista negativo: " + vela.esMartilloAlcistaPositivo(parseFloat(lastCandle.open), parseFloat(lastCandle.high), parseFloat(lastCandle.low), parseFloat(lastCandle.close)));
     console.info(symbol + " martillo bajista positivo: " + vela.esMartilloAlcistaPositivo(parseFloat(lastCandle.open), parseFloat(lastCandle.high), parseFloat(lastCandle.low), parseFloat(lastCandle.close)));
    const rsi = await indicadores.calcularRSI(chart);
    const ema= await indicadores.calcularEMA(chart,200);
    console.info(parseFloat(lastCandle.high));
    console.info(rsi);
    console.info(ema);
    console.log('zzzzzzzzzzzzzzzzzzzzzzzzzzzzz');
    console.info(vela.porcentajeMovimoentoVela(parseFloat(lastCandle.high),parseFloat(lastCandle.low)));
    console.info('distancia ema por debajo, se espera que baje el precio (comprobado)' );
    console.info(vela.porcentajeMovimoentoVela(parseFloat(lastCandle.low),parseFloat(ema)));

    console.info('distancia ema por arriba, se espera que suba el precio (comprobado)' );
    console.info(vela.porcentajeMovimoentoVela(parseFloat(ema),parseFloat(lastCandle.high)));


  }

});
