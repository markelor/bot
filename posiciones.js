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
/**
 * Función que
 */
const precision = async () => {
  try {
    monedasInfo = await binance.futuresExchangeInfo();

    const monedas = [];
    let minQuantity;
    for (let monedaInfo in monedasInfo.symbols) {
      let obj = monedasInfo.symbols[monedaInfo];
      for (let filter in obj.filters) {
        let filtro = obj.filters[filter];
        if (filtro.filterType === "LOT_SIZE") {
          minQuantity = filtro.minQty;
        }
      }
      process.env.MONEDAS.split(",").forEach((moneda) => {
        if (moneda === obj.symbol) {
          monedas.push({
            name: moneda,
            quantityPrecision: parseFloat(obj.quantityPrecision),
            minQuantity: parseFloat(minQuantity),
          });
        }
      });
    }
    return monedas;
  } catch (error) {
    console.log("error precision", error);
  }
};
/**
 * Función que ajusta el tipo de orden
 * @param {*} monedas
 */
const ajustarTipo = async (monedas) => {
  try {
    for (let moneda in monedas) {
      await binance.futuresMarginType(monedas[moneda].name, "ISOLATED");
    }
  } catch (error) {
    console.log("error ajustar tipo", error);
  }
};
/**
 * Funcion para ajustar el apalancamiento
 * @param {float} apalancamiento
 */
const ajustarApalancamiento = async (symbol, apalancamiento) => {
  try {
    if (apalancamiento < 200) {
      await binance.futuresLeverage(symbol, Math.round(apalancamiento));
    }
  } catch (error) {
    console.log("error ajustar apalancamiento", error);
  }
};
/**
 * Funcion para calcular el balance de la cuenta
 * @returns
 */

const calcularBalance = async () => {
  try {
    balances = await binance.futuresBalance();
    for (let asset in balances) {
      let obj = balances[asset];
      if (obj.asset === "USDT") {
        return parseFloat(obj.balance);
      }
    }
  } catch (error) {
    console.log("error calcular balance", error);
  }
};
/**
 * Función que calcula las unidades a comprar
 * @param {float} precio precio de entrada
 * @returns
 */

const calcularUnidadesConPrecio = (precio) => {
  return (parseFloat(process.env.RIESGO) * 10) / precio;
};
/**
 * Función que calcula el apalancamiento que debemos tomar
 * Formula: Apalancamiento=riesgo/(porcentajeMovimientoVela*capitalOperacion)
 * @param {float} riesgo lo que el usuario está dispuesto a perder, normalmente 1%
 * @param {float} porcentajeMovimoentoVela el porcentaje que se ha movido la vela
 * @param {float} capitalOperacion el capital que se pondra para coger una posición (isolated)
 */

const calcularApalancamiento = (
  riesgo,
  porcentajeMovimoentoVela,
  capitalOperacion
) => {
  return riesgo / (porcentajeMovimoentoVela * capitalOperacion);
};

module.exports = {
  ajustarTipo,
  ajustarApalancamiento,
  calcularBalance,
  calcularUnidadesConPrecio,
  calcularApalancamiento,
  precision,
};
