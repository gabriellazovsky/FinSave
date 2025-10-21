require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const jwt = require("jsonwebtoken");
const { Parser } = require("json2csv");
const { Cliente, Cuenta, Movimiento, Feedback } = require("./models");
const { isDuplicateMovement } = require("./duplicateCheck");

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || "change_me";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function autenticarToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // "Bearer <jwt>"
    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
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
        return res.json({ ok: true, token, nombre: cliente.nombre });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Error en login" });
    }
});


/* ------------ Protected examples ------------ */
app.post("/movimientos", autenticarToken, async (req, res) => {
    try {
        const { idCuenta, tipo, monto, descripcion, fecha, force } = req.body;

        // 1) Verify the account belongs to the logged-in user
        const cuenta = await Cuenta.findOne({ _id: idCuenta, idCliente: req.user.id }).lean();
        if (!cuenta) {
            return res.status(403).json({ message: "Cuenta no pertenece al usuario" });
        }

        // 2) Duplicate check scoped to this account
        if (!force) {
            const isDup = await isDuplicateMovement({ idCuenta: cuenta._id, tipo, monto, descripcion, fecha });
            if (isDup) return res.status(409).json({ message: "Movimiento duplicado" });
        }

        // 3) Persist using the verified account id (never trust the body blindly)
        const mov = await Movimiento.create({
            idCuenta: cuenta._id,
            tipo,
            monto,
            descripcion,
            fecha
        });

        res.status(201).json(mov);
    } catch (err) {
        console.error("Error creando movimiento:", err);
        res.status(500).json({ message: "Error creando movimiento" });
    }
});


app.get("/historial/:id", autenticarToken, async (req, res) => {
    // Confirm the account is the caller's
    const cuenta = await Cuenta.findOne({ _id: req.params.id, idCliente: req.user.id }).lean();
    if (!cuenta) return res.status(403).json({ message: "Cuenta no pertenece al usuario" });

    const movimientos = await Movimiento.find({ idCuenta: cuenta._id }).sort({ fecha: -1 });
    res.json(movimientos);
});


app.get("/cuenta-por-cliente/:idCliente", autenticarToken, async (req, res) => {
    try {
        if (req.params.idCliente !== req.user.id) {
            return res.status(403).json({ message: "Prohibido" });
        }
        const cuenta = await ensureCuentaForCliente(req.user.id);
        res.json({ cuentaId: cuenta._id.toString() });
    } catch {
        res.status(500).json({ message: "No se pudo obtener/crear cuenta" });
    }
});


// RUTAS DE FEEDBACK //
app.post("/api/feedback", autenticarToken, async (req, res) => {
  try {
    const { comentario } = req.body;
    const idCliente = req.user.id;

    if (!comentario || comentario.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'El comentario no puede estar vacío'
      });
    }

    if (/^\d+$/.test(comentario.trim())) {
      return res.status(400).json({
        success: false,
        error: 'El comentario no puede contener solo números'
      });
    }

    const feedback = new Feedback({
      idCliente,
      comentario: comentario.trim()
    });

    await feedback.save();

    res.status(201).json({
      success: true,
      message: 'Feedback enviado correctamente'
    });

  } catch (error) {
    console.error('Error al guardar feedback:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: Object.values(error.errors)[0].message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error del servidor'
    });
  }
});

app.get("/api/feedback", autenticarToken, async (req, res) => {
  try {
    const idCliente = req.user.id;
    const feedbacks = await Feedback.find({ idCliente }).sort({ fecha: -1 });
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener feedbacks' });
  }
});

app.get("/feedback", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "feedback.html"));
});

app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.get("/cuenta-mia", autenticarToken, async (req, res) => {
    const cuenta = await ensureCuentaForCliente(req.user.id);
    res.json({ cuentaId: cuenta._id.toString() });
});

app.get("/historial-mio", autenticarToken, async (req, res) => {
    const cuenta = await ensureCuentaForCliente(req.user.id);
    const movimientos = await Movimiento.find({ idCuenta: cuenta._id }).sort({ fecha: -1 });
    res.json(movimientos);
});


module.exports = { app };
if (require.main === module) {
    app.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));
}
