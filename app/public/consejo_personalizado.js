// Cliente: carga recomendaciones personalizadas desde /api/recommendations
const token = localStorage.getItem('token');
const authHeaders = () => token ? { Authorization: `Bearer ${token}` } : {};

const statusEl = document.getElementById('status');
const recsEl = document.getElementById('recs');
const diagEl = document.getElementById('diag');
const diagContent = document.getElementById('diagContent');

async function loadRecommendations(debug = false) {
    try {
        statusEl.textContent = 'Cargando recomendaciones...';
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
            statusEl.textContent = 'No hay recomendaciones personalizadas disponibles aún.';
            return;
        }

        statusEl.textContent = `Mostrando ${recs.length} recomendaci${recs.length===1? 'ón':'ones'}`;

        recs.forEach((r, i) => {
            const card = document.createElement('div');
            card.className = 'card-contenido card-small p-3';
            card.innerHTML = `
                <div style="font-size:28px">💡</div>
                <h3 class="text-lg font-semibold">Consejo ${i+1}</h3>
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
        statusEl.textContent = 'Error cargando recomendaciones.';
        recsEl.innerHTML = `<div class="text-danger">${err.message}</div>`;
    }
}

document.getElementById('btnRefresh').addEventListener('click', () => loadRecommendations(false));
document.getElementById('btnDiag').addEventListener('click', () => loadRecommendations(true));

// Cargar al inicio
loadRecommendations(false);

