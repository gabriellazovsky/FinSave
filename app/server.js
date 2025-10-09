require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const jwt = require("jsonwebtoken");
const { Parser } = require("json2csv");
const { Cliente, Cuenta, Movimiento } = require("./models");

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || "change_me";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function autenticarToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // expects "Bearer <jwt>"
    if (!token) return res.sendStatus(401);
    jwt.verify(SECRET_KEY ? token : "", SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finsave";
if (process.env.NODE_ENV !== "test") {
    mongoose.connect(MONGODB_URI)
        .then(() => console.log("MongoDB conectado"))
        .catch(err => console.error("Error MongoDB:", err));
}

app.get("/health/db", (req, res) => {
    res.json({ state: mongoose.connection.readyState });
});

// ensure one main account per client
async function ensureCuentaForCliente(idCliente) {
    let cuenta = await Cuenta.findOne({ idCliente });
    if (!cuenta) cuenta = await Cuenta.create({ idCliente, tipo: "principal", saldoActual: 0 });
    return cuenta;
}

/* ------------ REGISTER (no encryption) ------------ */
app.post("/registro", async (req, res) => {
    try {
        const { nombre, correo, password } = req.body || {};
        if (!nombre || !correo || !password) {
            return res.status(400).json({ message: "Faltan campos" });
        }

        const norm = String(correo).toLowerCase().trim();

        // check duplicate
        const exists = await Cliente.findOne({ correo: norm }).lean();
        if (exists) return res.status(409).json({ message: "Correo ya registrado" });

        // store password in plain text (learning only)
        const cliente = await Cliente.create({ nombre, correo: norm, password });

        const cuenta = await ensureCuentaForCliente(cliente._id);

        return res.status(201).json({
            ok: true,
            message: "Registro exitoso",
            clienteId: cliente._id.toString(),
            cuentaId: cuenta._id.toString(),
        });
    } catch (err) {
        if (err && err.code === 11000) return res.status(409).json({ message: "Correo ya registrado" });
        console.error(err);
        return res.status(500).json({ message: "Error en registro" });
    }
});

/* ------------ LOGIN (match by pair) ------------ */
app.post("/login", async (req, res) => {
    try {
        const { correo, password } = req.body || {};

        // Validate
        if (typeof correo !== "string" || typeof password !== "string") {
            return res.status(400).json({ message: "Faltan campos" });
        }
        const email = correo.trim().toLowerCase();
        if (!email || !password) {
            return res.status(400).json({ message: "Faltan campos" });
        }

        // Find by email only
        const cliente = await Cliente.findOne({ correo: email }).lean();
        if (!cliente) return res.status(401).json({ message: "Credenciales inválidas" });

        // Compare plain passwords (learning only)
        if (cliente.password !== password) {
            return res.status(401).json({ message: "Credenciales inválidas" });
        }

        // Issue JWT
        const token = jwt.sign({ id: cliente._id, correo: cliente.correo }, SECRET_KEY, { expiresIn: "1h" });
        return res.json({ ok: true, token });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Error en login" });
    }
});


/* ------------ Protected examples ------------ */
app.post("/movimientos", autenticarToken, async (req, res) => {
    const { idCuenta, tipo, monto, descripcion, fecha } = req.body;
    const mov = await Movimiento.create({ idCuenta, tipo, monto, descripcion, fecha });
    res.json(mov);
});

app.get("/historial/:id", autenticarToken, async (req, res) => {
    const movimientos = await Movimiento.find({ idCuenta: req.params.id }).sort({ fecha: -1 });
    res.json(movimientos);
});

app.get("/cuenta-por-cliente/:idCliente", async (req, res) => {
    try {
        const cuenta = await ensureCuentaForCliente(req.params.idCliente);
        res.json({ cuentaId: cuenta._id.toString() });
    } catch {
        res.status(500).json({ message: "No se pudo obtener/crear cuenta" });
    }
});

app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

module.exports = { app };
if (require.main === module) {
    app.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));
}
