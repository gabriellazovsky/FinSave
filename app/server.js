require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const jwt = require("jsonwebtoken");
const { Parser } = require("json2csv");
const { Cliente, Cuenta, Movimiento } = require("./models");

const app = express();
const PORT = 3000;
const SECRET_KEY = "clave_super_segura";

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finsave";
mongoose.connect(MONGODB_URI)
    .then(() => console.log("MongoDB conectado"))
    .catch(err => console.error("Error MongoDB:", err));


app.get("/health/db", (req, res) => {
    res.json({ state: mongoose.connection.readyState });
});

async function ensureCuentaForCliente(idCliente) {
    let cuenta = await Cuenta.findOne({ idCliente });
    if (!cuenta) {
        cuenta = await Cuenta.create({ idCliente, tipo: 'principal', saldoActual: 0 });
    }
    return cuenta;
}



// Registro de usuario
// Registro de usuario  (DEV-friendly: returns clienteId + cuentaId)
app.post("/registro", async (req, res) => {
    try {
        const { nombre, correo, password } = req.body;
        if (!nombre || !correo || !password) {
            return res.status(400).json({ message: "Faltan campos" });
        }

        const existe = await Cliente.findOne({ correo });
        if (existe) {
            // si ya existe, devolvemos su id también (útil en dev)
            // y aseguramos que tenga una cuenta
            let cuenta = await Cuenta.findOne({ idCliente: existe._id });
            if (!cuenta) {
                cuenta = await Cuenta.create({ idCliente: existe._id, tipo: "principal", saldoActual: 0 });
            }
            return res.status(200).json({
                message: "Correo ya registrado",
                clienteId: existe._id.toString(),
                cuentaId: cuenta._id.toString(),
            });
        }

        const cliente = await Cliente.create({ nombre, correo, password });
        const cuenta = await Cuenta.create({
            idCliente: cliente._id,
            tipo: "principal",
            saldoActual: 0,
        });

        res.json({
            message: "Registro exitoso",
            clienteId: cliente._id.toString(),
            cuentaId: cuenta._id.toString(),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error en registro" });
    }
});



// Login
app.post("/login", async (req, res) => {
    const { correo, password } = req.body;
    const cliente = await Cliente.findOne({ correo, password });
    if (!cliente) return res.status(401).json({ message: "Credenciales inválidas" });

    const token = jwt.sign({ id: cliente._id, correo: cliente.correo }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ token });
});

// Middleware JWT
function autenticarToken(req, res, next) { next(); }

/*
function autenticarToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}
*/
// Movimientos
app.post("/movimientos", autenticarToken, async (req, res) => {
    const { idCuenta, tipo, monto, descripcion, fecha } = req.body;
    const mov = new Movimiento({ idCuenta, tipo, monto, descripcion, fecha });
    await mov.save();
    res.json(mov);
});

app.get("/historial/:id", autenticarToken, async (req, res) => {
    const movimientos = await Movimiento.find({ idCuenta: req.params.id }).sort({ fecha: -1 });
    res.json(movimientos);
});

app.get('/cuenta-por-cliente/:idCliente', async (req, res) => {
    try {
        const cuenta = await ensureCuentaForCliente(req.params.idCliente);
        res.json({ cuentaId: cuenta._id.toString() });
    } catch (e) {
        res.status(500).json({ message: 'No se pudo obtener/crear cuenta' });
    }
});

app.get('/cuenta-por-cliente/:idCliente', async (req, res) => {
    try {
        const cuenta = await ensureCuentaForCliente(req.params.idCliente);
        res.json({ cuentaId: cuenta._id.toString() });
    } catch (e) {
        res.status(500).json({ message: 'No se pudo obtener/crear cuenta' });
    }
});


app.get("/exportar", autenticarToken, async (req, res) => {
    const movimientos = await Movimiento.find().lean();
    if (!movimientos || movimientos.length === 0) return res.status(204).send("No hay datos");

    const parser = new Parser();
    const csv = parser.parse(movimientos);
    res.header("Content-Type", "text/csv; charset=utf-8");
    res.attachment("movimientos.csv");
    res.send(csv);
});

// Servir HTML

app.get('/', (req, res) =>
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
);


app.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));

