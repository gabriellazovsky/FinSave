// Cliente: carga recomendaciones personalizadas desde /api/recommendations
const token = localStorage.getItem('token');
const authHeaders = () => token ? { Authorization: `Bearer ${token}` } : {};

const statusEl = document.getElementById('status');
const recsEl = document.getElementById('recs');
const diagEl = document.getElementById('diag');
const diagContent = document.getElementById('diagContent');

async function loadRecommendations(debug = false) {
    try {
        statusEl.textContent = i18n("loadingRecommendations");
        recsEl.innerHTML = '';
        diagEl.classList.add('hidden');

        const url = debug ? '/api/recommendations?debug=1' : '/api/recommendations';
        const res = await fetch(url, { headers: { ...authHeaders() } });
        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`Error ${res.status}: ${txt}`);
        }
        const data = await res.json();
        const recs = data.recommendations || [];

        if (recs.length === 0) {
            statusEl.textContent = i18n("noRecommendations");
            return;
        }

        statusEl.textContent = i18n("showingRecommendations")
            .replace("{count}", recs.length);

        recs.forEach((r, i) => {
            const card = document.createElement('div');
            card.className = 'card-contenido card-small p-3';
            card.innerHTML = `
                <div style="font-size:28px">💡</div>
                <h3 class="text-lg font-semibold">${i18n("tipNumber").replace("{number}", i+1)}</h3>
                <p class="text-gray-700">${r}</p>
            `;
            recsEl.appendChild(card);
        });

        if (debug && data) {
            diagContent.textContent = JSON.stringify(data, null, 2);
            diagEl.classList.remove('hidden');
        }
    } catch (err) {
        console.error(err);
        statusEl.textContent = i18n("errorLoadingRecommendations");
        recsEl.innerHTML = `<div class="text-danger">${err.message}</div>`;
    }
}

document.getElementById('btnRefresh').addEventListener('click', () => loadRecommendations(false));
document.getElementById('btnDiag').addEventListener('click', () => loadRecommendations(true));

// Cargar al inicio
loadRecommendations(false);
