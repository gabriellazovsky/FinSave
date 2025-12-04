import { generateRecommendations } from './recommendations.js';

// --- Helper para traducciones con parámetros ---
function translateTemplate(key, params = {}) {
    let txt = translations[currentLang][key] || key;
    for (const [k,v] of Object.entries(params)) {
        txt = txt.replace(`{${k}}`, v);
    }
    return txt;
}

// --- Referencias DOM ---
const statusEl = document.getElementById('status');
const recsEl = document.getElementById('recs');
const diagEl = document.getElementById('diag');
const diagContent = document.getElementById('diagContent');
const btnRefresh = document.getElementById('btnRefresh');
const btnDiag = document.getElementById('btnDiag');

// --- Cargar recomendaciones ---
async function loadRecommendations(debug = false) {
    try {
        statusEl.textContent = translateTemplate("loadingRecommendations");
        recsEl.innerHTML = '';
        diagEl.classList.add('hidden');

        // Suponemos movimientos cargados desde localStorage o API
        const movimientos = JSON.parse(localStorage.getItem('movimientos') || '[]');
        const recs = generateRecommendations(movimientos);

        if (recs.length === 0) {
            statusEl.textContent = translateTemplate("noRecommendations");
            return;
        }

        statusEl.textContent = translateTemplate("showingRecommendations", { count: recs.length });

        recs.forEach((r, i) => {
            const card = document.createElement('div');
            card.className = 'card-contenido card-small p-3';
            card.innerHTML = `
                <div style="font-size:28px">💡</div>
                <h3 class="text-lg font-semibold">${translateTemplate("tipNumber", { number: i+1 })}</h3>
                <p class="text-gray-700">${r}</p>
            `;
            recsEl.appendChild(card);
        });

        if (debug) {
            diagContent.textContent = JSON.stringify(recs, null, 2);
            diagEl.classList.remove('hidden');
        }

    } catch (err) {
        console.error(err);
        statusEl.textContent = translateTemplate("errorLoadingRecommendations");
        recsEl.innerHTML = `<div class="text-danger">${err.message}</div>`;
    }
}

// --- Botones ---
btnRefresh.addEventListener('click', () => loadRecommendations(false));
btnDiag.addEventListener('click', () => loadRecommendations(true));

// --- Cargar al inicio ---
document.addEventListener('DOMContentLoaded', () => loadRecommendations(false));

// --- Dark mode (ya lo tenías) ---
document.addEventListener('DOMContentLoaded', () => {
    const toggles = document.querySelectorAll('.theme-switch__checkbox, .checkbox');
    function applyTheme(isDark) {
        document.body.classList.toggle('dark', isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        toggles.forEach(t => t.checked = isDark);
    }
    toggles.forEach(toggle => toggle.addEventListener('change', () => applyTheme(toggle.checked)));
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') applyTheme(true);
});
