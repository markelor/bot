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

const inicializar = async () => {
  //Fondos de la cuenta
  const balance = await posiciones.calcularBalance();

  const monedas = await posiciones.precision();
  //Isolated
  const isolated = await posiciones.ajustarTipo(monedas);

  console.info(balance);
  console.info(monedas);
  console.info(isolated);
  //Escuchar web shocket por cada moneda
  monedas.map((moneda) => {
    binance.websockets.chart(
      moneda.name,
      "1m",
      async (symbol, interval, chart) => {
        chartKeys = binance.slice(chart, -2);
        let velaActual = chart[chartKeys[1]];
        let velaAnterior = chart[chartKeys[0]];
        try {
          let monedaEnCola = await binance.futuresOpenOrders(symbol);
          if (
            velaActual &&
            velaActual.isFinal === undefined &&
            monedaEnCola.length === 0
          ) {
            // anular todos los ordenes
            //const anularOrdenes = await binance.futuresCancelAll(symbol);
            let velaActualOpen = parseFloat(velaActual.open);
            let velaActualHigh = parseFloat(velaActual.high);
            let velaActualLow = parseFloat(velaActual.low);
            let velaActualClose = parseFloat(velaActual.close);
            let velaAnteriorOpen = parseFloat(velaAnterior.open);
            let velaAnteriorClose = parseFloat(velaAnterior.close);
            riesgo = parseFloat(process.env.RIESGO);
            const apalancamiento = posiciones.calcularApalancamiento(
              riesgo,
              vela.porcentajeMovimoentoVela(velaActualHigh, velaActualLow),
              riesgo * 10
            );
            posiciones.ajustarApalancamiento(symbol, apalancamiento);
            const rsi = parseFloat(await indicadores.calcularRSI(chart));
            const ema = parseFloat(await indicadores.calcularEMA(chart, 200));
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
              !vela.esVelaAlcista(velaAnteriorOpen, velaAnteriorClose) &&
              apalancamiento < 200
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
              console.info(symbol);
              console.info(dateStr);
              console.info("movimientoAlcista");
              console.info("----------------------------------------");
              console.info(rsi);
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
                console.info("quantity precision", moneda.quantityPrecision);
                console.info("imprimir esto");
                const unidades = posiciones
                  .calcularUnidadesConPrecio(velaActualOpen)
                  .toFixed(moneda.quantityPrecision);

                console.info("unidades", unidades);
                console.info("min-quantity", moneda.minQuantity);
                console.info("open", velaActualOpen);
                if (unidades > moneda.minQuantity) {
                  compra = await binance.futuresBuy(
                    symbol,
                    unidades,
                    velaActualOpen.toFixed(moneda.quantityPrecision)
                  );
                  /* stopLost = await binance.futuresSell(
                    symbol,
                    unidades,
                    false,
                    {
                      type: "STOP_MARKET",
                      stopPrice: (
                        velaActualOpen -
                        (velaActualHigh - velaActualLow)
                      ).toFixed(moneda.quantityPrecision),
                    }
                  );*/
                  takeProfit = await binance.futuresSell(
                    symbol,
                    unidades,
                    false,
                    {
                      type: "STOP_MARKET",
                      stopPrice: (
                        velaActualOpen +
                        (velaActualHigh - velaActualLow)
                      ).toFixed(moneda.quantityPrecision),
                    }
                  );

                  console.info("compra", compra);
                  //console.info("stopLost", stopLost);
                  console.info("takeProfit", takeProfit);
                }
              } else if (
                vela.esMartilloAlcistaNegativo(
                  velaActualOpen,
                  velaActualHigh,
                  velaActualLow,
                  velaActualClose
                )
              ) {
                // Limit en cierre
                console.info("quantity precision", moneda.quantityPrecision);       
                const unidades = posiciones
                  .calcularUnidadesConPrecio(velaActualClose)
                  .toFixed(moneda.quantityPrecision);
                  console.info("unidades", unidades);
                  console.info("min-quantity", moneda.minQuantity);
                  console.info("close", velaActualClose);
                if (unidades > moneda.minQuantity) {
                  compra = await binance.futuresBuy(
                    symbol,
                    unidades,
                    velaActualClose.toFixed(moneda.quantityPrecision)
                    
                  );
                  /*stopLost = await binance.futuresSell(
                    symbol,
                    unidades,
                    false,
                    {
                      type: "STOP_MARKET",
                      stopPrice:
                        (velaActualClose - (velaActualHigh - velaActualLow)).toFixed(moneda.quantityPrecision),
                    }
                  );*/
                  takeProfit = await binance.futuresSell(
                    symbol,
                    unidades,
                    false,
                    {
                      type: "STOP_MARKET",
                      stopPrice: (
                        velaActualClose +
                        (velaActualHigh - velaActualLow)
                      ).toFixed(moneda.quantityPrecision),
                    }
                  );
                  console.info("compra", compra);
                  //console.info("stopLost", stopLost);
                  console.info("takeProfit", takeProfit);
                }
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
              vela.esVelaAlcista(velaAnteriorOpen, velaAnteriorClose) &&
              apalancamiento < 200
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
                console.info("quantity precision", moneda.quantityPrecision);
                const unidades = posiciones
                  .calcularUnidadesConPrecio(velaActualOpen)
                  .toFixed(moneda.quantityPrecision);
                  console.info("unidades", unidades);
                  console.info("min-quantity", moneda.minQuantity);
                  console.info("close", velaActualOpen);
                if (unidades > moneda.minQuantity) {
                  venta = await binance.futuresSell(
                    symbol,
                    unidades,
                    velaActualOpen.toFixed(moneda.quantityPrecision)
                  );
                  /*stopLost = await binance.futuresSell(
                    symbol,
                    unidades,
                    false,
                    {
                      type: "STOP_MARKET",
                      stopPrice:
                        (velaActualOpen + (velaActualHigh - velaActualLow)).toFixed(moneda.quantityPrecision),
                    }
                  );*/
                  takeProfit = await binance.futuresSell(
                    symbol,
                    unidades,
                    false,
                    {
                      type: "STOP_MARKET",
                      stopPrice: (
                        velaActualOpen -
                        (velaActualHigh - velaActualLow)
                      ).toFixed(moneda.quantityPrecision),
                    }
                  );
                  console.info("venta", venta);
                  //console.info("stopLost", stopLost);
                  console.info("takeProfit", takeProfit);
                }
              } else if (
                vela.esMartilloBajistaPositivo(
                  velaActualOpen,
                  velaActualHigh,
                  velaActualLow,
                  velaActualClose
                )
              ) {
                // limit en cierre

                const unidades = posiciones
                  .calcularUnidadesConPrecio(velaActualClose)
                  .toFixed(moneda.quantityPrecision);
                console.info("quantity precision", moneda.quantityPrecision);
                console.info("unidades", unidades);
                console.info("min-quantity", moneda.minQuantity);
                console.info("close", velaActualClose);
                if (unidades > moneda.minQuantity) {
                  venta = await binance.futuresSell(
                    symbol,
                    unidades,
                    velaActualClose.toFixed(moneda.quantityPrecision)
                  );
                  /*stopLost = await binance.futuresSell(
                    symbol,
                    unidades,
                    false,
                    {
                      type: "STOP_MARKET",
                      stopPrice:
                        (velaActualClose + (velaActualHigh - velaActualLow)).toFixed(moneda.quantityPrecision),
                    }
                  );*/
                  takeProfit = await binance.futuresSell(
                    symbol,
                    unidades,
                    false,
                    {
                      type: "STOP_MARKET",
                      stopPrice: (
                        velaActualClose -
                        (velaActualHigh - velaActualLow)
                      ).toFixed(moneda.quantityPrecision),
                    }
                  );
                  console.info("venta", venta);
                  //console.info("stopLost", stopLost);
                  console.info("takeProfit", takeProfit);
                }
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
              console.info(symbol);
              console.info(dateStr);
              console.info("movimientoBajista");
              console.info("----------------------------------------");
              console.info(rsi);
              console.info(ema);
              console.info(
                "distancia ema por debajo, se espera que baje el precio (comprobado)"
              );
              console.info(vela.porcentajeMovimoentoVela(velaActualLow, ema));
            }
          }
        } catch (error) {
          await binance.futuresCancelAll(symbol);
          console.info(error);
        }
      }
    );
  });
};
inicializar();
