
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
const monedas = process.env.MONEDAS.split(", ");
/**
 * Función que ajusta el tipo de orden
 */
const ajustarTipo = async () => {
  for (let moneda in monedas) {
    await binance.futuresMarginType(moneda, "ISOLATED");
  }
};
/**
 * Funcion para ajustar el apalancamiento
 * @param {float} apalancamiento
 */
const ajustarApalancamiento = async (apalancamiento) => {
  for (let moneda in monedas) {
    await binance.futuresLeverage(moneda, apalancamiento);
  }
};
/**
 * Funcion para calcular el balance de la cuenta
 * @returns
 */

const calcularBalance = async () => {
  balances = await binance.futuresBalance();
  for (let asset in balances) {
    let obj = balances[asset];
    if (obj.asset === "USDT") {
      return parseFloat(obj.balance);
    }
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
};
