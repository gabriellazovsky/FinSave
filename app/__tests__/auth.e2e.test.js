const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const { Cliente, Cuenta, Movimiento } = require('../models');

const email = `e2e_${Date.now()}@test.com`;
const password = '123';

beforeAll(async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/finsave_test';
    await mongoose.connect(uri);
});

afterAll(async () => {
    await Movimiento.deleteMany({});
    await Cuenta.deleteMany({});
    await Cliente.deleteMany({ correo: email });
    await mongoose.connection.close();
});

test('register → login → protected route', async () => {
    await request(app)
        .post('/registro')
        .send({ nombre: 'E2E', correo: email, password })
        .expect(res => {
            if (![200, 201, 409].includes(res.status)) {
                throw new Error('Unexpected status on /registro');
            }
        });

    await request(app)
        .post('/login')
        .send({ correo: email, password: 'contrasenaIncorrecta' })
        .expect(401);

    const login = await request(app)
        .post('/login')
        .send({ correo: email, password })
        .expect(200);

    expect(login.body.token).toBeDefined();
    const token = login.body.token;

    await request(app)
        .get('/historial/someId')
        .expect(401);

    const cuentaRes = await request(app)
        .get('/cuenta-mia')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

    const cuentaId = cuentaRes.body.cuentaId;
    expect(cuentaId).toBeDefined();

    const mov = await request(app)
        .post('/movimientos')
        .set('Authorization', `Bearer ${token}`)
        .send({
            idCuenta: cuentaId,
            tipo: 'ingreso',
            monto: 10,
            descripcion: 'test movimiento',
            fecha: new Date().toISOString(),
        })
        .expect(201);

    expect(mov.body._id).toBeDefined();

    const hist = await request(app)
        .get(`/historial/${cuentaId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

    expect(Array.isArray(hist.body)).toBe(true);
    expect(hist.body.length).toBeGreaterThan(0);
});
