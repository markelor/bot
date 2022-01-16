const dotenv = require("dotenv");
dotenv.config();
const Binance = require("node-binance-api");
const binance = new Binance().options({
  APIKEY: process.env.API_KEY,
  APISECRET: process.env.API_SECRET,
  test: true,
  verbose: true,
  urls: {
    base: "https://testnet.binance.vision/api/",
    combineStream: "wss://testnet.binance.vision/stream?streams=",
    stream: "wss://testnet.binance.vision/ws/",
  },
});
const vela = require("./vela");
const indicadores = require("./indicadores");
const posiciones = require("./posiciones");
const monedas = process.env.MONEDAS.split(",");
console.log("monedas");
console.log(monedas);
//Isolated
posiciones.ajustarTipo();
//Fondos de la cuenta
posiciones.calcularBalance();
//Escuchar web shocket por cada moneda
monedas.map((moneda) => {
  binance.websockets.chart(moneda, "1m", async (symbol, interval, chart) => {
    chartKeys = binance.slice(chart, -2);
    let velaActual = chart[chartKeys[1]];
    let velaAnterior = chart[chartKeys[0]];

    if (velaActual && velaActual.isFinal === undefined) {
      let velaActualOpen = parseFloat(velaActual.open);
      let velaActualHigh = parseFloat(velaActual.high);
      let velaActualLow = parseFloat(velaActual.low);
      let velaActualClose = parseFloat(velaActual.close);
      let velaAnteriorOpen = parseFloat(velaAnterior.open);
      let velaAnteriorClose = parseFloat(velaAnterior.close);
      riesgo = parseFloat(process.env.RIESGO);
      //await binance.futuresCancelAll(symbol);
      const rsi = parseFloat(await indicadores.calcularRSI(chart));
      const ema = parseFloat(await indicadores.calcularEMA(chart, 200));
      const apalancamiento = posiciones.calcularApalancamiento(
        riesgo,
        vela.porcentajeMovimoentoVela(velaActualHigh, velaActualLow),
        riesgo * 10
      );
      posiciones.ajustarApalancamiento(apalancamiento);
      console.log(apalancamiento);
      console.log(symbol);

      //Compra

      if (
        (vela.esMartilloAlcistaPositivo(
          velaActualOpen,
          velaActualHigh,
          velaActualLow,
          velaActualClose
        ) ||
          vela.esMartilloAlcistaNegativo(
            velaActualOpen,
            velaActualHigh,
            velaActualLow,
            velaActualClose
          )) &&
        /*rsi < 25 && vela.porcentajeMovimoentoVela(ema, velaActualHigh) > parseFloat(0.01)&&*/
        !vela.esVelaAlcista(velaAnteriorOpen, velaAnteriorClose)
      ) {
        var date = new Date();
        var dateStr =
          ("00" + (date.getMonth() + 1)).slice(-2) +
          "/" +
          ("00" + date.getDate()).slice(-2) +
          "/" +
          date.getFullYear() +
          " " +
          ("00" + date.getHours()).slice(-2) +
          ":" +
          ("00" + date.getMinutes()).slice(-2) +
          ":" +
          ("00" + date.getSeconds()).slice(-2);
        console.log(symbol);
        console.log(dateStr);
        console.log("movimientoAlcista");
        console.log("----------------------------------------");
        console.log(rsi);
        console.info(ema);
        console.info(
          "distancia ema por arriba, se espera que suba el precio (comprobado)"
        );
        console.info(vela.porcentajeMovimoentoVela(ema, velaActualHigh));
        if (
          vela.esMartilloAlcistaPositivo(
            velaActualOpen,
            velaActualHigh,
            velaActualLow,
            velaActualClose
          )
        ) {
          // Limit en apertura
          const unidades = posiciones.calcularUnidadesConPrecio(velaActualOpen);

          compra = await binance.futuresBuy(symbol, unidades, velaActualOpen);
          stopLost = await binance.futuresSell(
            symbol,
            unidades,
            velaActualOpen - (velaActualHigh - velaActualLow),
            {
              stopPrice: velaActualOpen + (velaActualHigh - velaActualLow),
              type: "STOP_LOSS_LIMIT",
              timeInForce: "GTC",
              priceProtect: true,
            }
          );
          takeProfit = await binance.futuresSell(
            symbol,
            unidades,
            velaActualOpen + (velaActualHigh - velaActualLow),
            {
              stopPrice: velaActualOpen + (velaActualHigh - velaActualLow),
              type: "TAKE_PROFIT_LIMIT",
              timeInForce: "GTC",
              priceProtect: true,
            }
          );
          console.log("compra", compra);
          console.log("stopLost", stopLost);
          console.log("takeProfit", takeProfit);
        } else if (
          vela.esMartilloAlcistaNegativo(
            velaActualOpen,
            velaActualHigh,
            velaActualLow,
            velaActualClose
          )
        ) {
          // Limit en cierre
          const unidades = posiciones.calcularUnidadesConPrecio(velaActualClose);
          compra = await binance.futuresBuy(symbol, unidades, velaActualClose);
          stopLost = await binance.futuresSell(
            symbol,
            unidades,
            velaActualClose - (velaActualHigh - velaActualLow),
            {
              stopPrice: velaActualClose + (velaActualHigh - velaActualLow),
              type: "STOP_LOSS_LIMIT",
              timeInForce: "GTC",
              priceProtect: true,
            }
          );
          takeProfit = await binance.futuresSell(
            symbol,
            unidades,
            velaActualClose + (velaActualHigh - velaActualLow),
            {
              stopPrice: velaActualClose + (velaActualHigh - velaActualLow),
              type: "TAKE_PROFIT_LIMIT",
              timeInForce: "GTC",
              priceProtect: true,
            }
          );
          console.log("compra", compra);
          console.log("stopLost", stopLost);
          console.log("takeProfit", takeProfit);
        }

        //Venta
      } else if (
        (vela.esMartilloBajistaPositivo(
          velaActualOpen,
          velaActualHigh,
          velaActualLow,
          velaActualClose
        ) ||
          vela.esMartilloBajistaNegativo(
            velaActualOpen,
            velaActualHigh,
            velaActualLow,
            velaActualClose
          )) &&
        /*rsi > 75 &&vela.porcentajeMovimoentoVela(velaActualLow, ema) > parseFloat(0.01) &&*/
        vela.esVelaAlcista(velaAnteriorOpen, velaAnteriorClose)
      ) {
        if (
          vela.esMartilloBajistaNegativo(
            velaActualOpen,
            velaActualHigh,
            velaActualLow,
            velaActualClose
          )
        ) {
          // limit en apertura
          const unidades = posiciones.calcularUnidadesConPrecio(velaActualOpen);
          venta = await binance.futuresBuy(symbol, unidades, velaActualOpen);
          stopLost = await binance.futuresSell(
            symbol,
            unidades,
            velaActualOpen + (velaActualHigh - velaActualLow),
            {
              stopPrice: velaActualOpen + (velaActualHigh - velaActualLow),
              type: "STOP_LOSS_LIMIT",
              timeInForce: "GTC",
              priceProtect: true,
            }
          );
          takeProfit = await binance.futuresSell(
            symbol,
            unidades,
            velaActualOpen - (velaActualHigh - velaActualLow),
            {
              stopPrice: velaActualOpen - (velaActualHigh - velaActualLow),
              type: "TAKE_PROFIT_LIMIT",
              timeInForce: "GTC",
              priceProtect: true,
            }
          );
          console.log("venta", venta);
          console.log("stopLost", stopLost);
          console.log("takeProfit", takeProfit);
        } else if (
          vela.esMartilloBajistaPositivo(
            velaActualOpen,
            velaActualHigh,
            velaActualLow,
            velaActualClose
          )
        ) {
          // limit en cierre
          const unidades = posiciones.calcularUnidadesConPrecio(velaActualClose);
          venta = await binance.futuresBuy(symbol, unidades, velaActualClose);
          stopLost = await binance.futuresSell(
            symbol,
            unidades,
            velaActualClose + (velaActualHigh - velaActualLow),
            {
              stopPrice: velaActualClose + (velaActualHigh - velaActualLow),
              type: "STOP_LOSS_LIMIT",
              timeInForce: "GTC",
              priceProtect: true,
            }
          );
          takeProfit = await binance.futuresSell(
            symbol,
            unidades,
            velaActualClose - (velaActualHigh - velaActualLow),
            {
              stopPrice: velaActualClose - (velaActualHigh - velaActualLow),
              type: "TAKE_PROFIT_LIMIT",
              timeInForce: "GTC",
              priceProtect: true,
            }
          );
          console.log("venta", venta);
          console.log("stopLost", stopLost);
          console.log("takeProfit", takeProfit);
        }

        var date = new Date();
        var dateStr =
          ("00" + (date.getMonth() + 1)).slice(-2) +
          "/" +
          ("00" + date.getDate()).slice(-2) +
          "/" +
          date.getFullYear() +
          " " +
          ("00" + date.getHours()).slice(-2) +
          ":" +
          ("00" + date.getMinutes()).slice(-2) +
          ":" +
          ("00" + date.getSeconds()).slice(-2);
        console.log(symbol);
        console.log(dateStr);
        console.log("movimientoBajista");
        console.log("----------------------------------------");
        console.log(rsi);
        console.info(ema);
        console.info(
          "distancia ema por debajo, se espera que baje el precio (comprobado)"
        );
        console.info(vela.porcentajeMovimoentoVela(velaActualLow, ema));
      }
    }
  });
});
