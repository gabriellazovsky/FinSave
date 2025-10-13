const { Movimiento } = require('./models');

/**
 * Mira si un movimiento con el mismo idCuenta, tipo, monto, descripcion y fecha ya existe
 * @param {{idCuenta:string,tipo:string,monto:number,descripcion:string,fecha:string|Date}} data
 * @returns {Promise<boolean>} verdadero si el duplicado ya existe
 */
async function isDuplicateMovement(data) {
    if (!data) return false;
    const { idCuenta, tipo, monto, descripcion, fecha } = data;

    if (!idCuenta || !tipo || (monto === undefined || monto === null) || !descripcion || !fecha) return false;

    const descNorm = String(descripcion).trim();
    const tipoNorm = String(tipo).trim().toLowerCase();
    const montoNum = Number(monto);
    const fechaObj = new Date(fecha);
    if (Number.isNaN(montoNum) || isNaN(fechaObj.getTime())) return false;

    // Exact match query
    const existing = await Movimiento.findOne({
        idCuenta: idCuenta,
        tipo: tipoNorm,
        monto: montoNum,
        descripcion: descNorm,
        fecha: fechaObj
    }).lean();

    return !!existing;
}

module.exports = { isDuplicateMovement };
