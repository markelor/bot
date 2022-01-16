
const dotenv = require('dotenv')
dotenv.config();
const Binance = require('node-binance-api');
const binance = new Binance().options({
  APIKEY: process.env.API_KEY,
  APISECRET: process.env.API_SECRET,
  test:true,
  verbose: true,
  urls: {
    base: 'https://testnet.binance.vision/api/',
    combineStream: 'wss://testnet.binance.vision/stream?streams=',
    stream: 'wss://testnet.binance.vision/ws/'
 }
});
const vela = require("./vela");
const indicadores = require("./indicadores");
const simbolos = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT', 'XRPUSDT', 'LUNAUSDT', 'DOTUSDT', 'DOGEUSDT', 'AVAXUSDT',
  'MATICUSDT', 'SHIBUSDT', 'LINKUSDT', 'NEARUSDT', 'CROUSDT', 'LTCUSDT', 'UNIUSDT', 'DAIUSDT', 'ATOMUSDT', 'ALGOUSDT'];



const ajustarTipo = async () => {
  for (let simbolo in simbolos) {
    await binance.futuresMarginType(simbolo, 'ISOLATED')
  }
};
const ajustarApalancamiento = async (apalancamiento) => {
  for (let simbolo in simbolos) {
    await binance.futuresLeverage('simbolo', apalancamiento)
  }
};

const calcularBalance = async () => {
  balances = await binance.futuresBalance();
  for (let asset in balances) {
    let obj = balances[asset];
    if (obj.asset === 'USDT') {
      return parseFloat(obj.balance);
    }

  }
};

const calcularUnidadesConPrecio = async (precio) => {
  return (parseFloat(process.env.RIESGO) * 10) / precio;
};
ajustarTipo();

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


      //await binance.futuresCancelAll(symbol);
      const rsi = parseFloat(await indicadores.calcularRSI(chart));
      const ema = await indicadores.calcularEMA(chart, 200);
      const apalancamiento = calcularApalancamiento(parseFloat(process.env.RIESGO), vela.porcentajeMovimoentoVela(parseFloat(velaActual.high), parseFloat(velaActual.low)), parseFloat(process.env.RIESGO) * 10);
      ajustarApalancamiento(apalancamiento);
      console.log(apalancamiento);
      console.log(symbol);;

      //Compra

      if ((vela.esMartilloAlcistaPositivo(parseFloat(velaActual.open), parseFloat(velaActual.high), parseFloat(velaActual.low), parseFloat(velaActual.close)) ||
        vela.esMartilloAlcistaNegativo(parseFloat(velaActual.open), parseFloat(velaActual.high), parseFloat(velaActual.low), parseFloat(velaActual.close))) &&
        /*rsi < 25 && vela.porcentajeMovimoentoVela(parseFloat(ema), parseFloat(velaActual.high)) > parseFloat(0.01)&&*/
        !vela.esVelaAlcista(parseFloat(velaAnterior.open), parseFloat(velaAnterior.close))) {
        var date = new Date();
        var dateStr =
          ("00" + (date.getMonth() + 1)).slice(-2) + "/" +
          ("00" + date.getDate()).slice(-2) + "/" +
          date.getFullYear() + " " +
          ("00" + date.getHours()).slice(-2) + ":" +
          ("00" + date.getMinutes()).slice(-2) + ":" +
          ("00" + date.getSeconds()).slice(-2);
        console.log(symbol);;
        console.log(dateStr);
        console.log('movimientoAlcista');
        console.log('----------------------------------------');
        console.log(rsi);
        console.info(ema);
        console.info('distancia ema por arriba, se espera que suba el precio (comprobado)');
        console.info(vela.porcentajeMovimoentoVela(parseFloat(ema), parseFloat(velaActual.high)))
        if (vela.esMartilloAlcistaPositivo(parseFloat(velaActual.open), parseFloat(velaActual.high), parseFloat(velaActual.low), parseFloat(velaActual.close))) {

          // Limit en apertura
          const unidades = calcularUnidadesConPrecio(parseFloat(velaActual.open));
   
          compra= await binance.futuresBuy( simbolo, unidades, parseFloat(velaActual.open));
          stopLost=await binance.futuresSell(simbolo, unidades, parseFloat(velaActual.open)-(parseFloat(velaActual.high)-parseFloat(velaActual.low)), {
            stopPrice: parseFloat(velaActual.open)+(parseFloat(velaActual.high)-parseFloat(velaActual.low)),
            type: "STOP_LOSS_LIMIT",
            timeInForce: "GTC",
            priceProtect: true
          });
          takeProfit=await binance.futuresSell(simbolo, unidades, parseFloat(velaActual.open)+(parseFloat(velaActual.high)-parseFloat(velaActual.low)), {
            stopPrice: parseFloat(velaActual.open)+(parseFloat(velaActual.high)-parseFloat(velaActual.low)),
            type: "TAKE_PROFIT_LIMIT",
            timeInForce: "GTC",
            priceProtect: true
          });
          console.log('compra',compra);
          console.log('stopLost',stopLost);
          console.log('takeProfit',takeProfit);
        } else if (vela.esMartilloAlcistaNegativo(parseFloat(velaActual.open), parseFloat(velaActual.high), parseFloat(velaActual.low), parseFloat(velaActual.close))) {
          // Limit en cierre
          const unidades = calcularUnidadesConPrecio(parseFloat(velaActual.close));
          compra= await binance.futuresBuy( simbolo, unidades, parseFloat(velaActual.close ));
          stopLost=await binance.futuresSell(simbolo, unidades, parseFloat(velaActual.close)-(parseFloat(velaActual.high)-parseFloat(velaActual.low)), {
            stopPrice: parseFloat(velaActual.close)+(parseFloat(velaActual.high)-parseFloat(velaActual.low)),
            type: "STOP_LOSS_LIMIT",
            timeInForce: "GTC",
            priceProtect: true
          });
          takeProfit=await binance.futuresSell(simbolo, unidades, parseFloat(velaActual.close)+(parseFloat(velaActual.high)-parseFloat(velaActual.low)), {
            stopPrice: parseFloat(velaActual.close)+(parseFloat(velaActual.high)-parseFloat(velaActual.low)),
            type: "TAKE_PROFIT_LIMIT",
            timeInForce: "GTC",
            priceProtect: true
          });
          console.log('compra',compra);
          console.log('stopLost',stopLost);
          console.log('takeProfit',takeProfit);
        }

        //Venta

      } else if ((vela.esMartilloBajistaPositivo(parseFloat(velaActual.open), parseFloat(velaActual.high), parseFloat(velaActual.low), parseFloat(velaActual.close)) ||
        vela.esMartilloBajistaNegativo(parseFloat(velaActual.open), parseFloat(velaActual.high), parseFloat(velaActual.low), parseFloat(velaActual.close))) &&
         /*rsi > 75 &&vela.porcentajeMovimoentoVela(parseFloat(velaActual.low), parseFloat(ema)) > parseFloat(0.01) &&*/
        vela.esVelaAlcista(parseFloat(velaAnterior.open), parseFloat(velaAnterior.close))) {  
        if (vela.esMartilloBajistaNegativo(parseFloat(velaActual.open), parseFloat(velaActual.high), parseFloat(velaActual.low), parseFloat(velaActual.close))) {
          // limit en apertura
          const unidades = calcularUnidadesConPrecio(parseFloat(velaActual.open));
          venta= await binance.futuresBuy( simbolo, unidades, parseFloat(velaActual.open));
          stopLost=await binance.futuresSell(simbolo, unidades, parseFloat(velaActual.open)+(parseFloat(velaActual.high)-parseFloat(velaActual.low)), {
            stopPrice: parseFloat(velaActual.open)+(parseFloat(velaActual.high)-parseFloat(velaActual.low)),
            type: "STOP_LOSS_LIMIT",
            timeInForce: "GTC",
            priceProtect: true
          });
          takeProfit=await binance.futuresSell(simbolo, unidades, parseFloat(velaActual.open)-(parseFloat(velaActual.high)-parseFloat(velaActual.low)), {
            stopPrice: parseFloat(velaActual.open)-(parseFloat(velaActual.high)-parseFloat(velaActual.low)),
            type: "TAKE_PROFIT_LIMIT",
            timeInForce: "GTC",
            priceProtect: true
          });
          console.log('venta',venta);
          console.log('stopLost',stopLost);
          console.log('takeProfit',takeProfit);

        } else if (vela.esMartilloBajistaPositivo(parseFloat(velaActual.open), parseFloat(velaActual.high), parseFloat(velaActual.low), parseFloat(velaActual.close))) {
          // limit en cierre
          const unidades = calcularUnidadesConPrecio(parseFloat(velaActual.close));
          venta= await binance.futuresBuy( simbolo, unidades, parseFloat(velaActual.close));
          stopLost=await binance.futuresSell(simbolo, unidades, parseFloat(velaActual.close)+(parseFloat(velaActual.high)-parseFloat(velaActual.low)), {
            stopPrice: parseFloat(velaActual.close)+(parseFloat(velaActual.high)-parseFloat(velaActual.low)),
            type: "STOP_LOSS_LIMIT",
            timeInForce: "GTC",
            priceProtect: true
          });
          takeProfit=await binance.futuresSell(simbolo, unidades, parseFloat(velaActual.close)-(parseFloat(velaActual.high)-parseFloat(velaActual.low)), {
            stopPrice: parseFloat(velaActual.close)-(parseFloat(velaActual.high)-parseFloat(velaActual.low)),
            type: "TAKE_PROFIT_LIMIT",
            timeInForce: "GTC",
            priceProtect: true
          });
          console.log('venta',venta);
          console.log('stopLost',stopLost);
          console.log('takeProfit',takeProfit);

        }

        var date = new Date();
        var dateStr =
          ("00" + (date.getMonth() + 1)).slice(-2) + "/" +
          ("00" + date.getDate()).slice(-2) + "/" +
          date.getFullYear() + " " +
          ("00" + date.getHours()).slice(-2) + ":" +
          ("00" + date.getMinutes()).slice(-2) + ":" +
          ("00" + date.getSeconds()).slice(-2);
        console.log(symbol);;
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

