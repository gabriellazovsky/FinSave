(() => {
    const form   = document.getElementById('lp-form');
    const input  = document.getElementById('lp-symbols');
    const status = document.getElementById('lp-status');
    const list   = document.getElementById('lp-list');
    const clear  = document.getElementById('lp-clear');
    const livePricesBody = document.querySelector('#livePrices .offcanvas-body');


    const marketTabButton = document.getElementById('marketTab');
    const livePricesOffcanvas = document.getElementById('livePrices');


    if (!form || !input || !status || !list) return;

    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}/stream`);


    const rows = new Map();
    const activeSubs = new Set();
    const pollTimers = new Map();

    const popularGroups = [
        { title: 'Forex', symbols: ['EUR/USD','USD/JPY','GBP/USD','USD/CHF','AUD/USD','USD/CAD'] },
        { title: 'Crypto', symbols: ['BTC/USD','ETH/USD','SOL/USD','ADA/USD','DOGE/USD'] },
        { title: 'US Stocks', symbols: ['AAPL','MSFT','AMZN','GOOGL','META','TSLA','NVDA','SPY'] }
    ];

    function renderPopular() {
        if (!livePricesBody) return;
        let container = document.getElementById('lp-popular');
        if (!container) {
            container = document.createElement('div');
            container.id = 'lp-popular';
            container.className = 'd-flex flex-column gap-3';
            livePricesBody.insertBefore(container, status?.nextSibling || livePricesBody.firstChild);
        }
        container.innerHTML = '';
        for (const group of popularGroups) {
            const section = document.createElement('div');
            section.className = 'd-flex flex-column gap-2';
            const h = document.createElement('div');
            h.className = 'fw-semibold';
            h.textContent = group.title;
            section.appendChild(h);
            const wrap = document.createElement('div');
            wrap.className = 'd-flex flex-wrap gap-2';
            for (const sym of group.symbols) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn btn-sm';
                const active = activeSubs.has(sym.toUpperCase());
                btn.classList.add(active ? 'btn-success' : 'btn-outline-secondary');
                btn.textContent = active ? `✓ ${sym}` : sym;
                btn.addEventListener('click', () => toggleSubscription(sym));
                wrap.appendChild(btn);
            }
            section.appendChild(wrap);
            container.appendChild(section);
        }
    }

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
                <div class="d-flex align-items-center gap-3">
                    <div class="fs-5 fw-semibold" data-price></div>
                    <button type="button" class="btn btn-sm btn-outline-danger" data-unsub title="Unsubscribe">✕</button>
                </div>
      `;
            list.appendChild(el);
            rows.set(id, el);
            el.querySelector('[data-sym]').textContent = id;
                        el.querySelector('[data-unsub]')?.addEventListener('click', () => unsubscribe(id));
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
                    const up = String(m.symbol || '').toUpperCase();
                    const t = pollTimers.get(up);
                    if (t) { clearInterval(t); pollTimers.delete(up); }
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


        const symsArr = v.split(/\s*,\s*/).filter(Boolean);
        const symbols = symsArr.join(',');
        const payload = JSON.stringify({ action: 'subscribe', params: { symbols } });

        if (ws.readyState === WebSocket.OPEN) ws.send(payload);
        symsArr.forEach(s => activeSubs.add(s.toUpperCase()));
        renderPopular();
        input.value = '';
    });

    // Unsubscribe (clear UI and let server drop subs if you add that later)
    clear?.addEventListener('click', () => {
        list.innerHTML = '';
        rows.clear();
        status.textContent = 'Cleared';
        if (activeSubs.size) {
            const all = Array.from(activeSubs).join(',');
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ action: 'unsubscribe', params: { symbols: all } }));
            }
        }
        activeSubs.clear();
        for (const t of pollTimers.values()) clearInterval(t);
        pollTimers.clear();
        renderPopular();
        // If you later add an unsubscribe path on the server, send it here:
        // ws.send(JSON.stringify({ action: 'unsubscribe', params: { symbols: '*' } }));
    });

    function subscribe(sym) {
        const s = sym.trim(); if (!s) return;
        const up = s.toUpperCase();
        if (activeSubs.has(up)) return;
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: 'subscribe', params: { symbols: s } }));
        }
        activeSubs.add(up);
        renderPopular();

        // REST fallback polling (every 10s) until WS price clears it
        if (!pollTimers.has(up)) {
            const id = setInterval(async () => {
                try {
                    const r = await fetch(`/api/price?symbol=${encodeURIComponent(s)}`);
                    if (!r.ok) return;
                    const data = await r.json();
                    if (typeof data.price !== 'undefined') {
                        upsertRow(up, data.price, Date.now());
                    }
                } catch {}
            }, 10000);
            pollTimers.set(up, id);
        }
    }

    function unsubscribe(sym) {
        const s = sym.trim(); if (!s) return;
        const up = s.toUpperCase();
        if (!activeSubs.has(up)) return;
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: 'unsubscribe', params: { symbols: s } }));
        }
        activeSubs.delete(up);
        const row = rows.get(up);
        if (row) { rows.delete(up); row.remove(); }
        const t = pollTimers.get(up);
        if (t) { clearInterval(t); pollTimers.delete(up); }
        renderPopular();
    }

    function toggleSubscription(sym) {
        const up = sym.toUpperCase();
        if (activeSubs.has(up)) unsubscribe(sym); else subscribe(sym);
    }

    window.addEventListener("DOMContentLoaded", () => {
        const btn = document.getElementById("convertBtn");
        if (btn) {
            btn.addEventListener("click", convertirEurUsd);
        }

        renderPopular();

        if (livePricesOffcanvas && marketTabButton) {

            livePricesOffcanvas.addEventListener('show.bs.offcanvas', function () {
                marketTabButton.classList.add('hidden');
            });


            livePricesOffcanvas.addEventListener('hide.bs.offcanvas', function () {
                marketTabButton.classList.remove('hidden');
            });
        }
    });

})();