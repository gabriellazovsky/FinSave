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

// Conexión a MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/finsave", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB conectado"))
    .catch(err => console.error("Error MongoDB:", err));

// Registro de usuario
app.post("/registro", async (req, res) => {
    const { nombre, correo, password } = req.body;
    if (!nombre || !correo || !password) return res.status(400).json({ message: "Faltan campos" });
    const existe = await Cliente.findOne({ correo });
    if (existe) return res.status(400).json({ message: "Correo ya registrado" });

    const cliente = new Cliente({ nombre, correo, password });
    await cliente.save();
    res.json({ message: "Registro exitoso" });
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

