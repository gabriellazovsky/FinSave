const mongoose = require("mongoose");

// --- Cliente (User) ---
const clienteSchema = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true },
    identificacion: String,
    correo: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        index: true,
    },
    fechaRegistro: { type: Date, default: Date.now },
    // NOTE: plain text for now (not secure; for learning only)
    password: { type: String, required: true },
});

// --- Cuenta (Account) ---
const cuentaSchema = new mongoose.Schema({
    idCliente: { type: mongoose.Schema.Types.ObjectId, ref: "Cliente", required: true },
    tipo: { type: String, default: "principal" }, // prestamo, credito, inversion, principal
    saldoActual: { type: Number, default: 0 },
    fechaApertura: { type: Date, default: Date.now },
});

// --- Movimiento (Transaction) ---
const movimientoSchema = new mongoose.Schema({
    idCuenta: { type: mongoose.Schema.Types.ObjectId, ref: "Cuenta", required: true },
    tipo: { type: String, required: true }, // abono, cargo, interes
    monto: { type: Number, required: true },
    fecha: { type: Date, default: Date.now },
    descripcion: String,
});

const Cliente = mongoose.model("Cliente", clienteSchema);
const Cuenta = mongoose.model("Cuenta", cuentaSchema);
const Movimiento = mongoose.model("Movimiento", movimientoSchema);

module.exports = { Cliente, Cuenta, Movimiento };
