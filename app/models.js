const mongoose = require("mongoose");

const clienteSchema = new mongoose.Schema({
    nombre: String,
    identificacion: String,
    correo: String,
    fechaRegistro: { type: Date, default: Date.now }
});

const cuentaSchema = new mongoose.Schema({
    idCliente: { type: mongoose.Schema.Types.ObjectId, ref: "Cliente" },
    tipo: String, // prestamo, credito, inversion
    saldoActual: Number,
    fechaApertura: { type: Date, default: Date.now }
});

const movimientoSchema = new mongoose.Schema({
    idCuenta: { type: mongoose.Schema.Types.ObjectId, ref: "Cuenta" },
    tipo: String, // abono, cargo, interes
    monto: Number,
    fecha: { type: Date, default: Date.now },
    descripcion: String
});

const Cliente = mongoose.model("Cliente", clienteSchema);
const Cuenta = mongoose.model("Cuenta", cuentaSchema);
const Movimiento = mongoose.model("Movimiento", movimientoSchema);

module.exports = { Cliente, Cuenta, Movimiento };
