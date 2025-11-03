
(() => {
    const statusEl = document.getElementById('lp-status');
    const listEl   = document.getElementById('lp-list');
    const form     = document.getElementById('lp-form');
    const input    = document.getElementById('lp-symbols');
    const clearBtn = document.getElementById('lp-clear');

    if (!statusEl || !listEl || !form) return;

    const wsProto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${wsProto}//${location.host}/stream`);

    const state = new Map();

    function renderRow(symbol, price) {
        let row = state.get(symbol)?.el;
        const prev = state.get(symbol)?.price;

        if (!row) {
            row = document.createElement('div');
            row.className = 'list-group-item d-flex justify-content-between align-items-center';
            row.innerHTML = `
        <div class="fw-semibold">${symbol}</div>
        <div class="d-flex align-items-center gap-2">
          <span class="lp-price"></span>
          <span class="lp-delta badge rounded-pill"></span>
        </div>`;
            listEl.appendChild(row);
        }

        row.querySelector('.lp-price').textContent = Number(price).toFixed(4);
        const deltaEl = row.querySelector('.lp-delta');
        if (prev != null) {
            const diff = Number(price) - prev;
            const up = diff > 0, flat = diff === 0;
            deltaEl.textContent = flat ? '—' : (up ? `↑ ${diff.toFixed(4)}` : `↓ ${Math.abs(diff).toFixed(4)}`);
            deltaEl.className = `lp-delta badge rounded-pill ${flat ? 'bg-secondary' : up ? 'bg-success' : 'bg-danger'}`;
        } else {
            deltaEl.textContent = 'new';
            deltaEl.className = 'lp-delta badge rounded-pill bg-secondary';
        }
        state.set(symbol, { price: Number(price), el: row });
    }

    ws.addEventListener('open', () => {
        statusEl.textContent = 'Connected';
        // optional default subscribe; you can leave it empty and rely on the form
        // ws.send(JSON.stringify({ action: 'subscribe', params: { symbols: 'BTC/USD' } }));
    });

    ws.addEventListener('message', (ev) => {
        let msg; try { msg = JSON.parse(ev.data); } catch { return; }
        // console.log('msg', msg);
        if (msg.event === 'price') renderRow(msg.symbol, msg.price);
        else if (msg.event === 'subscribe-status') {
            statusEl.textContent = `Subscribed: ${(msg.success||[]).map(s=>s.symbol).join(', ')}`;
        } else if (msg.event === 'error') {
            statusEl.textContent = `Error: ${msg.message}`;
        }
    });

    ws.addEventListener('close', () => statusEl.textContent = 'Disconnected');
    ws.addEventListener('error', () => statusEl.textContent = 'Socket error');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const symbols = (input.value || '').trim().toUpperCase();
        if (!symbols) return;
        ws.send(JSON.stringify({ action: 'subscribe', params: { symbols } }));
        input.value = '';
    });

    clearBtn?.addEventListener('click', () => {
        ws.send(JSON.stringify({ action: 'reset' }));
        listEl.innerHTML = '';
        state.clear();
        statusEl.textContent = 'Cleared';
    });
})();
