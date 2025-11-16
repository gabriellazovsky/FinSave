require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const crypto = require("crypto");
const {Parser} = require("json2csv");
const {Cliente, Cuenta, Movimiento, Feedback} = require("./models");
const {isDuplicateMovement} = require("./duplicateCheck");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const http = require("http");
const cors = require("cors");
const {WebSocketServer, Server: WSServer } = require("ws");

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || "change_me";

function generarCodigo(length = 6) {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());

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

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finsave";
if (process.env.NODE_ENV !== "test") {
    mongoose.connect(MONGODB_URI)
        .then(() => console.log("MongoDB conectado"))
        .catch(err => console.error("Error MongoDB:", err));
}

app.get("/health/db", (req, res) => {
    res.json({ state: mongoose.connection.readyState });
});

async function ensureCuentaForCliente(idCliente) {
    let cuenta = await Cuenta.findOne({ idCliente });
    if (!cuenta) cuenta = await Cuenta.create({ idCliente, tipo: "principal", saldoActual: 0 });
    return cuenta;
}

/* ------------ REGISTER ------------ */
app.post("/registro", async (req, res) => {
    try {
        const { nombre, correo, password } = req.body || {};
        if (!nombre || !correo || !password) {
            return res.status(400).json({ message: "Faltan campos" });
        }
        const norm = String(correo).toLowerCase().trim();
        const exists = await Cliente.findOne({ correo: norm }).lean();
        if (exists) return res.status(409).json({ message: "Correo ya registrado" });
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

/* ------------ LOGIN ------------ */
app.post("/login", async (req, res) => {
    try {
        const { correo, password } = req.body || {};
        if (typeof correo !== "string" || typeof password !== "string") {
            return res.status(400).json({ message: "Faltan campos" });
        }
        const email = correo.trim().toLowerCase();
        const cliente = await Cliente.findOne({ correo: email }).lean();
        if (!cliente) return res.status(401).json({ message: "Credenciales inválidas" });
        if (cliente.password !== password) return res.status(401).json({ message: "Credenciales inválidas" });
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
        const cuenta = await Cuenta.findOne({ _id: idCuenta, idCliente: req.user.id }).lean();
        if (!cuenta) return res.status(403).json({ message: "Cuenta no pertenece al usuario" });
        if (!force) {
            const isDup = await isDuplicateMovement({ idCuenta: cuenta._id, tipo, monto, descripcion, fecha });
            if (isDup) return res.status(409).json({ message: "Movimiento duplicado" });
        }
        const mov = await Movimiento.create({ idCuenta: cuenta._id, tipo, monto, descripcion, fecha });
        res.status(201).json(mov);
    } catch (err) {
        console.error("Error creando movimiento:", err);
        res.status(500).json({ message: "Error creando movimiento" });
    }
});

app.get("/historial/:id", autenticarToken, async (req, res) => {
    const cuenta = await Cuenta.findOne({ _id: req.params.id, idCliente: req.user.id }).lean();
    if (!cuenta) return res.status(403).json({ message: "Cuenta no pertenece al usuario" });
    const movimientos = await Movimiento.find({ idCuenta: cuenta._id }).sort({ fecha: -1 });
    res.json(movimientos);
});

app.get("/cuenta-por-cliente/:idCliente", autenticarToken, async (req, res) => {
    try {
        if (req.params.idCliente !== req.user.id) return res.status(403).json({ message: "Prohibido" });
        const cuenta = await ensureCuentaForCliente(req.user.id);
        res.json({ cuentaId: cuenta._id.toString() });
    } catch {
        res.status(500).json({ message: "No se pudo obtener/crear cuenta" });
    }
});

// RUTAS DE FEEDBACK
app.post("/api/feedback", autenticarToken, async (req, res) => {
    try {
        const { comentario } = req.body;
        const idCliente = req.user.id;
        if (!comentario || comentario.trim().length === 0) return res.status(400).json({ success: false, error: 'El comentario no puede estar vacío' });
        if (/^\d+$/.test(comentario.trim())) return res.status(400).json({ success: false, error: 'El comentario no puede contener solo números' });
        const feedback = new Feedback({ idCliente, comentario: comentario.trim() });
        await feedback.save();
        res.status(201).json({ success: true, message: 'Feedback enviado correctamente' });
    } catch (error) {
        console.error('Error al guardar feedback:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, error: Object.values(error.errors)[0].message });
        }
        res.status(500).json({ success: false, error: 'Error del servidor' });
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

app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "public", "persona.html")));

app.get("/cuenta-mia", autenticarToken, async (req, res) => {
    const cuenta = await ensureCuentaForCliente(req.user.id);
    res.json({ cuentaId: cuenta._id.toString() });
});

app.get("/historial-mio", autenticarToken, async (req, res) => {
    const cuenta = await ensureCuentaForCliente(req.user.id);
    const movimientos = await Movimiento.find({ idCuenta: cuenta._id }).sort({ fecha: -1 });
    res.json(movimientos);
});

app.put("/movimientos/:id", autenticarToken, async (req, res) => {
    try {
        const movimiento = await Movimiento.findById(req.params.id);
        if (!movimiento) return res.status(404).json({ message: "Movimiento no encontrado" });

        // Verifica que el movimiento pertenezca al usuario
        const cuenta = await Cuenta.findOne({ _id: movimiento.idCuenta, idCliente: req.user.id });
        if (!cuenta) return res.status(403).json({ message: "No autorizado" });

        // Actualiza los campos permitidos
        const { tipo, monto, descripcion, fecha } = req.body;
        if (tipo !== undefined) movimiento.tipo = tipo;
        if (monto !== undefined) movimiento.monto = monto;
        if (descripcion !== undefined) movimiento.descripcion = descripcion;
        if (fecha !== undefined) movimiento.fecha = fecha;

        await movimiento.save();
        res.json({ ok: true, message: "Movimiento actualizado", movimiento });
    } catch (err) {
        console.error("Error editando movimiento:", err);
        res.status(500).json({ message: "Error editando movimiento" });
    }
});

app.delete("/movimientos/:id", autenticarToken, async (req, res) => {
    try {
        const movimiento = await Movimiento.findById(req.params.id);
        if (!movimiento) return res.status(404).json({ message: "Movimiento no encontrado" });

        // Verifica que el movimiento pertenezca al usuario
        const cuenta = await Cuenta.findOne({ _id: movimiento.idCuenta, idCliente: req.user.id });
        if (!cuenta) return res.status(403).json({ message: "No autorizado" });

        await movimiento.deleteOne();
        res.json({ ok: true, message: "Movimiento eliminado" });
    } catch (err) {
        console.error("Error eliminando movimiento:", err);
        res.status(500).json({ message: "Error eliminando movimiento" });
    }
});

/* ------------ OLVIDE CONTRASEÑA / 2FA ------------ */
const resetTokens = {}; // temporal en memoria

app.post("/password-reset/request", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email requerido" });

    const cliente = await Cliente.findOne({ correo: email.toLowerCase().trim() }).lean();
    if (!cliente) return res.status(404).json({ message: "Email no encontrado" });

    const codigo = generarCodigo();
    resetTokens[email] = { code: codigo, expires: Date.now() + 15*60*1000 };
    console.log("Código de restablecimiento:", codigo);

    // Enviar correo falso (solo notificación en la página)
    res.status(202).json({ message: "Correo enviado", code: codigo, from: "serverfalsodecorreo" });

    try {
        const resp = await axios.get("https://api.testmail.app/api/json", {
            params: {
                apikey: process.env.TESTMAIL_API_KEY,
                namespace: process.env.TESTMAIL_NAMESPACE,
                to: email,
                subject: "Restablecer contraseña - FinSave",
                body: `Tu código es: ${codigo} (válido 15 minutos)`,
                pretty: true
            }
        });
        if (resp.data.result !== "success") throw new Error(resp.data.message);
    } catch (err) {
        console.error("Error enviando correo:", err.message);
    }
});

app.post("/password-reset/confirm", async (req, res) => {
    const { email, code, password } = req.body;
    if (!email || !code || !password) return res.status(400).json({ message: "Faltan campos" });

    const tokenData = resetTokens[email];
    if (!tokenData) return res.status(400).json({ message: "Código inválido o expirado" });
    if (tokenData.code !== code || Date.now() > tokenData.expires) return res.status(400).json({ message: "Código inválido o expirado" });

    await Cliente.updateOne({ correo: email.toLowerCase().trim() }, { $set: { password } });
    delete resetTokens[email];
    return res.status(200).json({ message: "Contraseña restablecida correctamente" });
});

// --- WebSocket Twelve Data ---
const WebSocket = require('ws');
const API_KEY = process.env.TWELVEDATA_KEY;         // put this in .env
const TD_URL  = `wss://ws.twelvedata.com/v1/quotes/price?apikey=${API_KEY}`;

const server = http.createServer(app);
const wss    = new WebSocket.Server({ server, path: '/stream' });

let upstream = null;
let upstreamOpen = false;
let sendQueue = [];
const clients = new Set();
let pingTimer = null;

function ensureUpstream() {
    if (upstream && (upstream.readyState === WebSocket.CONNECTING || upstream.readyState === WebSocket.OPEN)) {
        return;
    }

    console.log('[WS] creating upstream → TwelveData');
    upstreamOpen = false;
    upstream = new WebSocket(TD_URL);

    upstream.on('open', () => {
        console.log('[WS] upstream -> OPEN');
        upstreamOpen = true;

        upstream.send(JSON.stringify({
            action: 'subscribe',
            params: { symbols: 'BTC/USD' }
        }));

        for (const msg of sendQueue) upstream.send(msg);
        sendQueue = [];

        clearInterval(pingTimer);
        pingTimer = setInterval(() => {
            if (upstream?.readyState === WebSocket.OPEN) {
                try { upstream.ping(); } catch {}
            }
        }, 15000);
    });


    upstream.on('message', (data) => {
        const text = data.toString();
         console.log('[WS] from upstream msg', data.toString());
        for (const c of clients) { try { c.send(data); } catch {} }
    });

    upstream.on('close', (code, reason) => {
        console.log('[WS] upstream closed', code, reason?.toString());
        upstreamOpen = false;
        clearInterval(pingTimer);
        const notice = JSON.stringify({ event: 'upstream-closed', code, reason: String(reason || '') });
        for (const c of clients) { try { c.send(notice); } catch {} }
        setTimeout(ensureUpstream, 1500); // backoff & reconnect
    });

    upstream.on('error', (e) => console.error('[WS] upstream error', e.message));

    upstream.on('unexpected-response', (req2, res) => {
        let body = '';
        res.on('data', c => body += c.toString());
        res.on('end', () => console.error('[WS] unexpected-response', res.statusCode, body));
    });
}

wss.on('connection', (client, req) => {
    console.log('[WS] browser connected from', req.socket.remoteAddress);
    clients.add(client);

    ensureUpstream();


    client.on('message', (data) => {
        try { console.log('[WS] from browser ->', JSON.stringify(JSON.parse(data.toString()))); }
        catch { console.log('[WS] from browser ->', data.toString()); }

        if (upstreamOpen && upstream?.readyState === WebSocket.OPEN) {
            upstream.send(data);
        } else {
            sendQueue.push(data);
        }
    });

    client.on('close', () => clients.delete(client));
    client.on('error', () => clients.delete(client));
});


module.exports = { app };

if (require.main === module) {
    server.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));
}

