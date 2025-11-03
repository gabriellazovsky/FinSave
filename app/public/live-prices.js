(() => {
    const form   = document.getElementById('lp-form');
    const input  = document.getElementById('lp-symbols');
    const status = document.getElementById('lp-status');
    const list   = document.getElementById('lp-list');
    const clear  = document.getElementById('lp-clear');

    if (!form || !input || !status || !list) return;

    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}/stream`);


    const rows = new Map();

    const fmtPrice = (p) => {
        const n = Number(p);
        if (!Number.isFinite(n)) return String(p);
        return n >= 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: 2 })
            : n.toLocaleString(undefined, { maximumFractionDigits: 6 });
    };
    const fmtTime = (ts) => {

        const ms = String(ts).length <= 10 ? Number(ts) * 1000 : Number(ts);
        if (!Number.isFinite(ms)) return '';
        return new Date(ms).toLocaleTimeString();
    };

    function upsertRow(symbol, price, ts) {
        const id = symbol.trim().toUpperCase();
        let el = rows.get(id);
        if (!el) {
            el = document.createElement('div');
            el.className = 'list-group-item d-flex justify-content-between align-items-center';
            el.dataset.symbol = id;
            el.innerHTML = `
        <div class="d-flex flex-column">
          <strong data-sym></strong>
          <small class="text-muted" data-ts></small>
        </div>
        <div class="fs-5 fw-semibold" data-price></div>
      `;
            list.appendChild(el);
            rows.set(id, el);
            el.querySelector('[data-sym]').textContent = id;
        }
        el.querySelector('[data-price]').textContent = fmtPrice(price);
        el.querySelector('[data-ts]').textContent = fmtTime(ts);
    }

    ws.addEventListener('open', () => { status.textContent = 'Connected'; });
    ws.addEventListener('close', () => { status.textContent = 'Disconnected'; });
    ws.addEventListener('error', () => { status.textContent = 'Socket error'; });

    ws.addEventListener('message', async (ev) => {
        let raw = ev.data;
        try {
            if (raw instanceof Blob)      raw = await raw.text();
            else if (raw instanceof ArrayBuffer) raw = new TextDecoder().decode(raw);
            else                            raw = String(raw);

            let msg = JSON.parse(raw);
            const items = Array.isArray(msg) ? msg : [msg];

            for (const m of items) {
                if (m && m.event === 'price') {
                    upsertRow(m.symbol, m.price, m.timestamp);
                } else if (m && m.event === 'error') {
                    status.textContent = `Error: ${m.message || 'unknown'}`;
                }
            }
        } catch (e) {
            console.error('WS parse error:', e, raw);
        }
    });



    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const v = input.value.trim();
        if (!v) return;


        const symbols = v.split(/\s*,\s*/).filter(Boolean).join(',');
        const payload = JSON.stringify({ action: 'subscribe', params: { symbols } });

        if (ws.readyState === WebSocket.OPEN) ws.send(payload);
        input.value = '';
    });

    // Unsubscribe (clear UI and let server drop subs if you add that later)
    clear?.addEventListener('click', () => {
        list.innerHTML = '';
        rows.clear();
        status.textContent = 'Cleared';
        // If you later add an unsubscribe path on the server, send it here:
        // ws.send(JSON.stringify({ action: 'unsubscribe', params: { symbols: '*' } }));
    });
})();
