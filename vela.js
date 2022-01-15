/**
 * Función que calcula si la vela es alcista
 * @param {float}} open apertura de la vela
 * @param {float}} close cierre de la vela
 * @returns  nos retorna un boleano que indica si la vela es alcista
 */
const esVelaAlcista = (open, close) => {
    if (open < close) {
        return true
    } else if (open > close) {
        return false;
    }

}
/**
 *Función que calcula si la vela martillo es alcista y si cierra por encima del precio de apertura
 * @param {float}} open apertura de la vela
 * @param {float}} high maximo de la vela
 * @param {float}} low minimo de la vela
 * @param {float}} close cierre de la vela
 * @returns  nos retorna un boleano que indica si la vela es alcista y positivo
 */
const esMartilloAlcistaPositivo = (open, high, low, close) => {
    if (esVelaAlcista(open, close) && (open - low) > ((close - open) * 3) && (high - close) < ((close - open) * 2)) {
        return true
    } else {
        return false;
    }

}
/**
 *  Función que calcula si la vela martillo es alcista y si cierra por debajo del precio de apertura
 * @param {float}} open apertura de la vela
 * @param {float}} high maximo de la vela
 * @param {float}} low minimo de la vela
 * @param {float}} close cierre de la vela
 * @returns  nos retorna un boleano que indica si la vela es alcista y negativo
 */
const esMartilloAlcistaNegativo = (open, high, low, close) => {
    if (!esVelaAlcista(open, close) && (close - low) > ((open - close) * 3) && (high - open) < ((open - close) * 2)) {
        return true
    } else {
        return false;
    }

}
/**
 *  Función que calcula si la vela martillo es bajista y si cierra por debajo del precio de apertura
 * @param {float}} open apertura de la vela
 * @param {float}} high maximo de la vela
 * @param {float}} low minimo de la vela
 * @param {float}} close cierre de la vela
 * @returns  nos retorna un boleano que indica si la vela es bajista y negativo
 */

const esMartilloBajistaNegativo = (open, high, low, close) => {
    if (!esVelaAlcista(open, close) && (high - open) > ((open - close) * 3) && (close - low) < ((open - close) * 2)) {
        return true
    } else {
        return false;
    }

}
/**
 * Función que calcula si la vela martillo es bajista y si cierra por encima del precio de apertura
 * @param {float}} open apertura de la vela
 * @param {float}} high maximo de la vela
 * @param {float}} low minimo de la vela
 * @param {float}} close cierre de la vela
 * @returns  nos retorna un boleano que indica si la vela es bajista y positivo
 */
const esMartilloBajistaPositivo = (open, high, low, close) => {
    if (esVelaAlcista(open, close) && (high - close) > ((close - open) * 3) && (open - low) < ((close - open) * 2)) {
        return true
    } else {
        return false;
    }

}
/**
 * Funcion que indica el porcentaje del movimiento de la vela entre su máximo y mínimo
 * @param {float}} high maximo de la vela
 * @param {float}} low minimo de la vela
 * @returns nos retorna un double que indica el porcentaje del movimiento de la vela
 */
const porcentajeMovimoentoVela = (high, low) => {
    return  (high - low)/ high;
}
module.exports = {
    esVelaAlcista,
    esMartilloAlcistaPositivo,
    esMartilloAlcistaNegativo,
    esMartilloBajistaNegativo,
    esMartilloBajistaPositivo,
    porcentajeMovimoentoVela

};
