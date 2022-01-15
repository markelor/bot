
const dotenv = require('dotenv')
dotenv.config();
const Binance = require('node-binance-api');
const binance = new Binance().options({
  APIKEY: process.env.API_KEY,
  APISECRET: process.env.API_SECRET,
  useServerTime: true,
  reconnect: false,
  verbose: true,
  test: true,
  urls: {
    base: "https://testnet.binance.vision/api/"
  }
});
console.log(process.env.API_KEY);
const vela = require("./vela");
const indicadores = require("./indicadores");
const simbolos = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT', 'XRPUSDT', 'LUNAUSDT', 'DOTUSDT', 'DOGEUSDT', 'AVAXUSDT',
  'MATICUSDT', 'SHIBUSDT', 'LINKUSDT', 'NEARUSDT', 'CROUSDT', 'LTCUSDT', 'UNIUSDT', 'DAIUSDT', 'ATOMUSDT', 'ALGOUSDT'];

const calcularBalance = async () => {
  balances = await binance.futuresBalance();
  for (let asset in balances) {
    let obj = balances[asset];
    if (obj.asset === 'USDT') {
      return parseFloat(obj.balance);
    }

  }
};
calcularBalance();
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

simbolos.map(simbolo => {
  binance.websockets.chart(simbolo, "1m", async (symbol, interval, chart) => {

    chartKeys = binance.slice(chart, -2);
    let velaActual = chart[chartKeys[1]];
    let velaAnterior = chart[chartKeys[0]];


    if (velaActual && velaActual.isFinal === undefined) {

      /* console.log('------------------------------------------------------------');
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
      */


      //Compra
      const rsi = parseFloat(await indicadores.calcularRSI(chart));
      const ema = await indicadores.calcularEMA(chart, 200);


      if ((vela.esMartilloAlcistaPositivo(parseFloat(velaActual.open), parseFloat(velaActual.high), parseFloat(velaActual.low), parseFloat(velaActual.close)) ||
        vela.esMartilloAlcistaNegativo(parseFloat(velaActual.open), parseFloat(velaActual.high), parseFloat(velaActual.low), parseFloat(velaActual.close))) &&
        rsi < 25 && vela.porcentajeMovimoentoVela(parseFloat(ema), parseFloat(velaActual.high)) > parseFloat(0.01) &&
        !vela.esVelaAlcista(parseFloat(velaAnterior.open), parseFloat(velaAnterior.close))) {
        var date = new Date();
        var dateStr =
          ("00" + (date.getMonth() + 1)).slice(-2) + "/" +
          ("00" + date.getDate()).slice(-2) + "/" +
          date.getFullYear() + " " +
          ("00" + date.getHours()).slice(-2) + ":" +
          ("00" + date.getMinutes()).slice(-2) + ":" +
          ("00" + date.getSeconds()).slice(-2);
        console.log(dateStr);
        console.log('movimientoAlcista');
        console.log('----------------------------------------');
        console.log(rsi);
        console.info(ema);
        console.info('distancia ema por arriba, se espera que suba el precio (comprobado)');
        console.info(vela.porcentajeMovimoentoVela(parseFloat(ema), parseFloat(velaActual.high)))


      } else if ((vela.esMartilloBajistaPositivo(parseFloat(velaActual.open), parseFloat(velaActual.high), parseFloat(velaActual.low), parseFloat(velaActual.close)) ||
        vela.esMartilloBajistaNegativo(parseFloat(velaActual.open), parseFloat(velaActual.high), parseFloat(velaActual.low), parseFloat(velaActual.close))) &&
        rsi > 75 && vela.porcentajeMovimoentoVela(parseFloat(velaActual.low), parseFloat(ema)) > parseFloat(0.01) &&
        vela.esVelaAlcista(parseFloat(velaAnterior.open), parseFloat(velaAnterior.close))) {

        var date = new Date();
        var dateStr =
          ("00" + (date.getMonth() + 1)).slice(-2) + "/" +
          ("00" + date.getDate()).slice(-2) + "/" +
          date.getFullYear() + " " +
          ("00" + date.getHours()).slice(-2) + ":" +
          ("00" + date.getMinutes()).slice(-2) + ":" +
          ("00" + date.getSeconds()).slice(-2);
        console.log(dateStr);
        console.log('movimientoBajista');
        console.log('----------------------------------------');
        console.log(rsi);
        console.info(ema);
        console.info('distancia ema por debajo, se espera que baje el precio (comprobado)');
        console.info(vela.porcentajeMovimoentoVela(parseFloat(velaActual.low), parseFloat(ema)));

      }
    }
  });
});

