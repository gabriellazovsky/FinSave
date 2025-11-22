require('dotenv').config();
const WebSocket = require('ws');

const API_KEY = process.env.TWELVEDATA_KEY;

const URL = 'wss://ws.twelvedata.com/v1/quotes/price?apikey=72a8048c51e94265bee9eac26e0af266';

const ws = new WebSocket(URL);


ws.on('open', () => {
    console.log('Connected.');
    const subscribeMsg = {
        action: 'subscribe',
        params: {symbols: 'AAPL'}
    };
    ws.send(JSON.stringify(subscribeMsg));
});

let alreadyShown = false;

ws.on('message', (data) => {
    try {
        const msg = JSON.parse(data);
        if (!alreadyShown && msg.event === 'price') {
            //console.log('Valores de BTC');
            alreadyShown = true;
        }
    } catch (e) {
    }
});

ws.on('close', (code, reason) => {
    console.log('Socket closed', code, reason?.toString());
});

ws.on('error', (err) => {
    console.error('Socket error', err);
});
