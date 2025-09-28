const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const { Parser } = require('json2csv');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Servir index.html

// Conexión a MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/finsave', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB conectado'))
    .catch(err => console.error('Error MongoDB:', err));

// Modelo Mongoose
const movimientoSchema = new mongoose.Schema({
    idCuenta: String,
    tipo: String,
    monto: Number,
    descripcion: String,
    fecha: Date
});
const Movimiento = mongoose.model('Movimiento', movimientoSchema);

// Guardar un movimiento
app.post('/movimientos', async (req, res) => {
    try {
        const nuevo = new Movimiento(req.body);
        await nuevo.save();
        res.json({ success: true, movimiento: nuevo });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Exportar todos los movimientos a CSV
app.get('/exportar', async (req, res) => {
    try {
        const movimientos = await Movimiento.find().lean();
        if (!movimientos || movimientos.length === 0) {
            return res.status(204).send('No hay datos para exportar');
        }

        const parser = new Parser();
        const csv = parser.parse(movimientos);

        res.header('Content-Type', 'text/csv; charset=utf-8');
        res.attachment('movimientos.csv');
        res.send(csv);
    } catch (err) {
        console.error('Error exportando CSV:', err);
        res.status(500).send('Error al exportar datos');
    }
});

// Obtener historial por ID de cliente
app.get('/historial/:id', async (req, res) => {
    try {
        const movimientos = await Movimiento.find({ idCuenta: req.params.id }).sort({ fecha: -1 });
        res.json(movimientos);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Iniciar servidor
app.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));
