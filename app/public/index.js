

// ---------------- Helpers ----------------
const getToken = () => localStorage.getItem("token");
const setToken = (t) => localStorage.setItem("token", t);
const clearToken = () => localStorage.removeItem("token");
const authHeaders = () => {
    const t = getToken();
    return t ? { Authorization: `Bearer ${t}` } : {};
};
const readJson = async (res) => { try { return await res.json(); } catch { return {}; } };

// ---------------- UI Sections ----------------
const loginSection = document.getElementById("login-pantalla");
const appSection = document.getElementById("website-pantalla");
const logrosSection = document.getElementById("logros-pantalla");

function showLogin() {
    appSection.classList.add("hidden");
    logrosSection.classList.add("hidden");
    loginSection.classList.remove("hidden");

    const compBtn = document.getElementById("finsaveComparativeBtn");
    if (compBtn) compBtn.style.display = "none";

    const widget = document.getElementById("finsaveChartWidget");
    if (widget) widget.remove();

    const marketBtn = document.getElementById("marketTab");
    if (marketBtn) marketBtn.style.display = "none";
}

function showApp() {
    loginSection.classList.add("hidden");
    logrosSection.classList.add("hidden");
    appSection.classList.remove("hidden");

    // mostrar comparativa cuando exista
    setTimeout(() => {
        const compBtn = document.getElementById("finsaveComparativeBtn");
        if (compBtn) compBtn.style.display = "block";
    }, 50);

    // mostrar market cuando exista
    setTimeout(() => {
        const marketBtn = document.getElementById("marketTab");
        if (marketBtn) marketBtn.style.display = "block";
    }, 50);
}
function showLogros(){ 
    loginSection.classList.add("hidden"); 
    appSection.classList.add("hidden"); 
    logrosSection.classList.remove("hidden"); 
}

if (getToken()) showApp(); else showLogin();
if (getToken() && localStorage.getItem("userName")) {
    mostrarBienvenida();
}

//la condenada lógica de logros segun el usuario
function getUserIdFromToken(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = JSON.parse(atob(parts[1]));
        return payload.id || payload.userId || payload.uid;
    } catch {
        return null;
    }
}
const defaultAchievements = [
    { id: 1, name: "Ahorrar 100€", completed: false },
    { id: 2, name: "Ahorrar 500€", completed: false },
    { id: 3, name: "Registrar 10 movimientos", completed: false },
    { id: 4, name: "Registrar 50 movimientos", completed: false },
    { id: 5, name: "Primer gasto registrado", completed: false },
    { id: 6, name: "Primer ingreso registrado", completed: false },
    { id: 7, name: "Ahorrar 1000€", completed: false },
    { id: 8, name: "Gasto en comida < 50€ en un mes", completed: false },
    { id: 9, name: "3 meses consecutivos de ahorro", completed: false },
    { id: 10, name: "Exportar tu historial a CSV", completed: false }
];

function loadUserAchievements(userId) {
    if (!userId) {
        return defaultAchievements;
    }
    const userKey = `achievements_${userId}`;
    const saved = localStorage.getItem(userKey);
    if (saved) {
        return JSON.parse(saved);
    } else {
        return defaultAchievements;
    }
}

let achievements = loadUserAchievements(getUserIdFromToken(localStorage.getItem('token')));

function saveUserAchievements() {
    const token = localStorage.getItem('token');
    const userId = getUserIdFromToken(token);
    if (!userId) return;
    const userKey = `achievements_${userId}`;
    localStorage.setItem(userKey, JSON.stringify(achievements));
}

function onUserLogin(token) {
    const userId = getUserIdFromToken(token);
    if (!userId) return;

    achievements = loadUserAchievements(userId);

    updateAchievementsUI();
}
// ---------------- Achievements (unchanged core) ----------------
function showAchievementNotification(achievementName) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    Object.assign(notification.style, {
        position: 'fixed', top: '20px', right: '20px', background: '#28a745', color: 'white', border: '2px solid #1e7e34',
        padding: '14px 18px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.25)', display: 'flex',
        alignItems: 'center', gap: '10px', zIndex: '9999', minWidth: '260px', fontFamily: 'system-ui, sans-serif'
    });
    notification.innerHTML = `
      <div class="icon" style="font-size:24px;">🏆</div>
      <div class="content" style="flex-grow:1;">
        <div class="title" style="font-weight:bold;">¡Logro Desbloqueado!</div>
        <div>${achievementName}</div>
      </div>
      <button class="close-btn" style="background:none;border:none;font-size:20px;font-weight:bold;color:white;cursor:pointer;position:absolute;top:6px;right:10px;">&times;</button>
    `;
    notification.querySelector('.close-btn').addEventListener('click', () => notification.remove());
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
}

function updateAchievementsUI() {
    achievements.forEach(a => {
        const badge = document.getElementById(`achievement-${a.id}`);
        if (!badge) return;
        badge.textContent = a.completed ? "Completado" : "Pendiente";
        badge.className = `status-badge ${a.completed ? 'completed' : 'pending'}`;
    });
    const completedCount = achievements.filter(a => a.completed).length;
    const pct = Math.round((completedCount / achievements.length) * 100);
    document.getElementById('progress-fill').style.width = `${pct}%`;
    document.getElementById('progress-text').textContent = `${pct}% Completado (${completedCount}/${achievements.length})`;
}

function resetAchievements() { 
    achievements.forEach(a => a.completed = false);
    updateAchievementsUI(); 
    saveUserAchievements();
}
function completeAchievement(id) { 
    const a = achievements.find(x => x.id === id);
     if (a && !a.completed) {
        a.completed = true;
        showAchievementNotification(a.name); 
        updateAchievementsUI();
        saveUserAchievements();
    }
}

//Achievements automatic check 
function checkAchievements(movimientos) {
    const totalAhorro = movimientos
        .filter(m => (m.tipo || '').toLowerCase() === 'ingreso')
        .reduce((sum, m) => sum + Number(m.monto || 0), 0)
        - movimientos
        .filter(m => (m.tipo || '').toLowerCase() === 'gasto')
        .reduce((sum, m) => sum + Number(m.monto || 0), 0);

    const gastosComidaEsteMes = movimientos
        .filter(m => (m.tipo || '').toLowerCase() === 'gasto' && (m.descripcion || '').toLowerCase().includes('comida'))
        .reduce((sum, m) => sum + Number(m.monto || 0), 0);
    
    const ingresosCount = movimientos.filter(m => (m.tipo || '').toLowerCase() === 'ingreso').length;
    const gastosCount = movimientos.filter(m => (m.tipo || '').toLowerCase() === 'gasto').length;

    //ahorrar 100€
    if (!achievements.find(a => a.id === 1).completed && totalAhorro >= 100) completeAchievement(1);
    //ahorrar 500€
    if (!achievements.find(a => a.id === 2).completed && totalAhorro >= 500) completeAchievement(2);
    //registrar 10 movimientos
    if (!achievements.find(a => a.id === 3).completed && movimientos.length >= 10) completeAchievement(3);
    //registrar 50 movimientos
    if (!achievements.find(a => a.id === 4).completed && movimientos.length >= 50) completeAchievement(4);
    //primer gasto registrado
    if (!achievements.find(a => a.id === 5).completed && gastosCount >= 1) completeAchievement(5);
    //primer ingreso registrado
    if (!achievements.find(a => a.id === 6).completed && ingresosCount >= 1) completeAchievement(6);
    //ahorrar 1000€
    if (!achievements.find(a => a.id === 7).completed && totalAhorro >= 1000) completeAchievement(7);
    //gasto en comida < 50€ en un mes
    if (!achievements.find(a => a.id === 8).completed && gastosComidaEsteMes < 50 && gastosComidaEsteMes > 0) completeAchievement(8);
    //3 meses consecutivos de ahorro
    if (!achievements.find(a => a.id === 9).completed) {
        const mesesAhorro = {};
        movimientos.forEach(m => {
            const date = new Date(m.fecha);
            if (isNaN(date)) return;
            const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
            if (!mesesAhorro[key]) mesesAhorro[key] = 0;
            const tipo = (m.tipo || '').toLowerCase();
            const monto = Number(m.monto) || 0;
            if (tipo === 'ingreso') mesesAhorro[key] += monto;
            else if (tipo === 'gasto') mesesAhorro[key] -= monto;
        });
        const meses = Object.keys(mesesAhorro).sort();
        let consecutivos = 0;
        for (let i = 0; i < meses.length; i++) {
            if (mesesAhorro[meses[i]] > 0) {
                consecutivos++;
                if (consecutivos >= 3) {
                    completeAchievement(9);
                    break;
                }
            } else {
                consecutivos = 0;
            }
        }
    }
}

// ---------------- Chart helper ----------------
function updateChartFromMovements(movimientos) {
    // Calcular totales de tipo y neto ()
    const totals = { ingreso: 0, gasto: 0 };
    // Agrupar por categoría (primera palabra de la descripción)
    const groups = {}; // { cat: amount }
    movimientos.forEach(m => {
        const tipo = (m.tipo || "").toLowerCase();
        const monto = Number(m.monto) || 0;
        if (tipo === 'ingreso') totals.ingreso += monto;
        else if (tipo === 'gasto') totals.gasto += monto;

        // extraer categoría desde la descripción (primera palabra alfanumérica)
        let desc = (m.descripcion || '').trim();
        let cat = 'otros';
        if (desc) {
            const match = desc.match(/[\p{L}\p{N}]+/u);
            if (match && match[0]) cat = match[0].toLowerCase();
        }
        groups[cat] = (groups[cat] || 0) + Math.abs(monto);
    });

    const ahorro = totals.ingreso - totals.gasto;

    // Construir gradiente para las categorías (outer ring)
    const chart = document.querySelector('.chart-container');
    const centerLabel = document.getElementById('centerLabel');
    const badgesContainer = document.getElementById('categoryBadges');

    const categoryEntries = Object.entries(groups).sort((a,b) => b[1]-a[1]);
    const totalCat = categoryEntries.reduce((s,[,v]) => s + v, 0) || 1;

    // Generar colores por categoría
    function colorForIndex(i){
        const hue = (i * 137) % 360; // variación
        return `hsl(${hue} 70% 50%)`;
    }

    if (chart) {
        let start = 0;
        const parts = [];
        categoryEntries.forEach(([cat, value], i) => {
            const pct = (value / totalCat) * 100;
            const end = start + pct;
            const color = colorForIndex(i);
            parts.push(`${color} ${start}% ${end}%`);
            start = end;
        });
        // fallback si no hay movimientos
        if (parts.length === 0) parts.push('#e9ecef 0% 100%');
        chart.style.background = `conic-gradient(${parts.join(',')})`;
    }

    // Actualizar el centro (ahorro) y su color
    if (centerLabel) {
      centerLabel.textContent = formatCurrency(ahorro);

        centerLabel.classList.remove('center-positive','center-negative');
        if (ahorro > 0) centerLabel.classList.add('center-positive');
        else if (ahorro < 0) centerLabel.classList.add('center-negative');
    }

    // Rellenar badges por categoría
    if (badgesContainer) {
        badgesContainer.innerHTML = '';
        categoryEntries.slice(0, 8).forEach(([cat, value], i) => {
            const pct = Math.round((value / totalCat) * 100);
            const span = document.createElement('span');
            span.style.background = colorForIndex(i);
            span.textContent = `${cat} ${pct}%`;
            badgesContainer.appendChild(span);
        });
    }
}

// ---------------- Floating comparative chart widget (dynamic) ----------------
let lastMovimientos = [];
let selectedTipos = new Set(['ingreso', 'gasto']);
let selectedCategories = null; // null -> all
let selectedYears = null; // null = all
let selectedMonths = null; // null = all

function extractCategoryFromMovimiento(m) {
    let desc = (m.descripcion || '').trim();
    if (!desc) return 'otros';
    const match = desc.match(/[\p{L}\p{N}]+/u);
    if (match && match[0]) return match[0].toLowerCase();
    return 'otros';
}

function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => resolve();
        s.onerror = (e) => reject(e);
        document.head.appendChild(s);
    });
}

async function ensureChartJs() {
    if (typeof Chart !== 'undefined') return;
    await loadScriptOnce('https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js');
    await loadScriptOnce('https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@2.0.1/dist/chartjs-plugin-zoom.min.js');
}

function createFloatingWidget() {
    if (document.getElementById('finsaveChartWidget')) return;
    const w = document.createElement('div');
    w.id = 'finsaveChartWidget';
    Object.assign(w.style, {
        position: 'fixed', right: '18px', bottom: '18px', width: '520px', maxWidth: 'calc(100% - 36px)',
        background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '10px', boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
        zIndex: 99999, padding: '12px', fontFamily: 'system-ui, sans-serif'
    });

w.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <strong data-i18n="comparison.title">Comparativa</strong>
        <button id="finsaveChartClose" style="background:none;border:none;cursor:pointer;font-size:16px" aria-label="Cerrar">✕</button>
    </div>
    <div style="display:flex;gap:10px;align-items:center;margin-bottom:8px">
        <label style="font-size:13px">
            <input type="checkbox" id="finsaveToggleIngresos" checked> 
            <span data-i18n="comparison.income">Ingresos</span>
        </label>
        <label style="font-size:13px">
            <input type="checkbox" id="finsaveToggleGastos" checked> 
            <span data-i18n="comparison.expenses">Gastos</span>
        </label>
    </div>
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
        <div style="font-size:13px;color:#555" data-i18n="comparison.year">Año:</div>
        <div id="finsaveYearDropdown" style="position:relative">
            <button id="finsaveYearBtn" style="padding:6px;border-radius:6px;border:1px solid #ddd;background:white;cursor:pointer">
                <span data-i18n="comparison.select_years">Seleccionar años</span> ▾
            </button>
            <div id="finsaveYearMenu" style="display:none;position:absolute;left:0;top:36px;background:white;border:1px solid #ddd;padding:8px;border-radius:6px;max-height:180px;overflow:auto;z-index:100000"></div>
        </div>
        <div style="font-size:13px;color:#555" data-i18n="comparison.month">Mes:</div>
        <div id="finsaveMonthDropdown" style="position:relative">
            <button id="finsaveMonthBtn" style="padding:6px;border-radius:6px;border:1px solid #ddd;background:white;cursor:pointer">
                <span data-i18n="comparison.select_months">Seleccionar meses</span> ▾
            </button>
            <div id="finsaveMonthMenu" style="display:none;position:absolute;left:0;top:36px;background:white;border:1px solid #ddd;padding:8px;border-radius:6px;max-height:220px;overflow:auto;z-index:100000"></div>
        </div>
    </div>
    <div style="margin-bottom:8px">
        <div style="font-size:13px;color:#555;margin-bottom:6px" data-i18n="comparison.categories">Categorías</div>
        <div id="finsaveCategoryFilters" style="display:flex;flex-wrap:wrap;gap:6px"></div>
    </div>
    <div style="height:260px"><canvas id="finsaveComparisonChart"></canvas></div>
`;


    document.body.appendChild(w);
    document.getElementById('finsaveChartClose').addEventListener('click', () => {
        try { if (_finsaveChartInstance) { _finsaveChartInstance.destroy(); _finsaveChartInstance = null; } } catch (e) { console.warn('Error destroying chart', e); }
        w.remove();
    });

    document.getElementById('finsaveToggleIngresos').addEventListener('change', (e) => {
        if (e.target.checked) selectedTipos.add('ingreso'); else selectedTipos.delete('ingreso');
        rebuildFloatingChart();
    });
    document.getElementById('finsaveToggleGastos').addEventListener('change', (e) => {
        if (e.target.checked) selectedTipos.add('gasto'); else selectedTipos.delete('gasto');
        rebuildFloatingChart();
    });
}

function renderCategoryFilters(categories) {
    createFloatingWidget();
    const container = document.getElementById('finsaveCategoryFilters');
    if (!container) return;
    container.innerHTML = '';
    if (selectedCategories === null) selectedCategories = new Set(categories);

    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.textContent = cat;
        btn.dataset.cat = cat;
        Object.assign(btn.style, { padding: '6px 8px', fontSize: '13px', borderRadius: '6px', border: '1px solid #ddd', background: selectedCategories.has(cat) ? '#0ea5a4' : '#f5f5f5', color: selectedCategories.has(cat) ? 'white' : '#333', cursor: 'pointer' });
        btn.addEventListener('click', () => {
            if (selectedCategories.has(cat)) selectedCategories.delete(cat); else selectedCategories.add(cat);
            btn.style.background = selectedCategories.has(cat) ? '#0ea5a4' : '#f5f5f5';
            btn.style.color = selectedCategories.has(cat) ? 'white' : '#333';
            rebuildFloatingChart();
        });
        container.appendChild(btn);
    });
}

function populateYearMonthSelects(movimientos) {
    createFloatingWidget();
    const yearMenu = document.getElementById('finsaveYearMenu');
    const monthMenu = document.getElementById('finsaveMonthMenu');
    const yearBtn = document.getElementById('finsaveYearBtn');
    const monthBtn = document.getElementById('finsaveMonthBtn');
    if (!yearMenu || !monthMenu || !yearBtn || !monthBtn) return;

    const byYear = {};
    movimientos.forEach(m => {
        const date = new Date(m.fecha);
        if (isNaN(date)) return;
        const y = date.getFullYear();
        const mo = date.getMonth() + 1;
        byYear[y] = byYear[y] || new Set();
        byYear[y].add(mo);
    });

    const years = Object.keys(byYear).map(Number).sort((a,b)=>b-a);

    yearMenu.innerHTML = '';
    years.forEach(y => {
        const id = `fy_${y}`;
        const wrapper = document.createElement('label');
        wrapper.style.display = 'flex'; wrapper.style.alignItems = 'center'; wrapper.style.gap = '8px'; wrapper.style.marginBottom = '6px';
        const cb = document.createElement('input'); cb.type = 'checkbox'; cb.value = String(y); cb.id = id; cb.checked = true;
        cb.addEventListener('change', () => {
            const sel = Array.from(yearMenu.querySelectorAll('input[type=checkbox]:checked')).map(i => Number(i.value));
            if (sel.length === 0 || sel.length === years.length) selectedYears = null; else selectedYears = new Set(sel);
            // actualiza los menús de mes para reflejar la unión de meses para los años seleccionados
            const monthsUnion = new Set();
            const yearsToCheck = selectedYears === null ? Object.keys(byYear).map(Number) : Array.from(selectedYears);
            yearsToCheck.forEach(yy => (byYear[yy] || new Set()).forEach(mo => monthsUnion.add(mo)));
            // reconstruye el menú de meses manteniendo las selecciones previas
            const prevSelected = selectedMonths === null ? null : new Set(Array.from(monthMenu.querySelectorAll('input[type=checkbox]:checked')).map(i=>Number(i.value)));
            monthMenu.innerHTML = '';
            const monthsArray = monthsUnion.size ? Array.from(monthsUnion).sort((a,b)=>a-b) : Array.from({length:12}, (_,i)=>i+1);
            monthsArray.forEach(mo => {
                const mid = `fm_${mo}`;
                const mwrap = document.createElement('label'); mwrap.style.display='flex'; mwrap.style.alignItems='center'; mwrap.style.gap='8px'; mwrap.style.marginBottom='6px';
                const mcb = document.createElement('input'); mcb.type='checkbox'; mcb.value=String(mo); mcb.id=mid; mcb.checked = prevSelected === null ? true : prevSelected.has(mo);
                mcb.addEventListener('change', () => {
                    const selm = Array.from(monthMenu.querySelectorAll('input[type=checkbox]:checked')).map(i=>Number(i.value));
                    selectedMonths = (selm.length === 0 || selm.length === monthMenu.querySelectorAll('input[type=checkbox]').length) ? null : new Set(selm);
                    rebuildFloatingChart();
                });
                const txt = document.createElement('span'); txt.textContent = String(mo).padStart(2,'0');
                mwrap.appendChild(mcb); mwrap.appendChild(txt); monthMenu.appendChild(mwrap);
            });
            const selmNow = Array.from(monthMenu.querySelectorAll('input[type=checkbox]:checked')).map(i=>Number(i.value));
            selectedMonths = (selmNow.length === 0 || selmNow.length === monthMenu.querySelectorAll('input[type=checkbox]').length) ? null : new Set(selmNow);
            rebuildFloatingChart();
        });
        const txt = document.createElement('span'); txt.textContent = String(y);
        wrapper.appendChild(cb); wrapper.appendChild(txt); yearMenu.appendChild(wrapper);
    });

    monthMenu.innerHTML = '';
    for (let mo = 1; mo <= 12; mo++) {
        const mid = `fm_${mo}`;
        const mwrap = document.createElement('label'); mwrap.style.display='flex'; mwrap.style.alignItems='center'; mwrap.style.gap='8px'; mwrap.style.marginBottom='6px';
        const mcb = document.createElement('input'); mcb.type='checkbox'; mcb.value=String(mo); mcb.id=mid; mcb.checked = true;
        mcb.addEventListener('change', () => {
            const selm = Array.from(monthMenu.querySelectorAll('input[type=checkbox]:checked')).map(i=>Number(i.value));
            selectedMonths = (selm.length === 0 || selm.length === monthMenu.querySelectorAll('input[type=checkbox]').length) ? null : new Set(selm);
            rebuildFloatingChart();
        });
        const txt = document.createElement('span'); txt.textContent = String(mo).padStart(2,'0');
        mwrap.appendChild(mcb); mwrap.appendChild(txt); monthMenu.appendChild(mwrap);
    }
    selectedYears = null; selectedMonths = null;

    function toggleMenu(menu, btn) {
        const visible = menu.style.display === 'block';
        document.querySelectorAll('#finsaveYearMenu, #finsaveMonthMenu').forEach(m => m.style.display = 'none');
        if (!visible) menu.style.display = 'block';
    }
    yearBtn.onclick = (e) => { e.stopPropagation(); toggleMenu(yearMenu, yearBtn); };
    monthBtn.onclick = (e) => { e.stopPropagation(); toggleMenu(monthMenu, monthBtn); };

    document.addEventListener('click', (ev) => {
        const p = ev.target;
        if (!yearMenu.contains(p) && p !== yearBtn) yearMenu.style.display = 'none';
        if (!monthMenu.contains(p) && p !== monthBtn) monthMenu.style.display = 'none';
    });
}

let _finsaveChartInstance = null;

async function rebuildFloatingChart() {
    await ensureChartJs();
    const movimientos = lastMovimientos || [];
    // aplica los filtros
    const filtered = movimientos.filter(m => {
        const tipo = (m.tipo || '').toLowerCase();
        if (!selectedTipos.has(tipo)) return false;

        const date = new Date(m.fecha);
        if (!isNaN(date)) {
            if (selectedYears && !selectedYears.has(date.getFullYear())) return false;
            if (selectedMonths && !selectedMonths.has(date.getMonth() + 1)) return false;
        }

        if (!selectedCategories || selectedCategories.size === 0) return false;
        const cat = extractCategoryFromMovimiento(m);
        return selectedCategories.has(cat);
    });

    // suma el mes
    const byMonth = {};
    filtered.forEach(m => {
        const date = new Date(m.fecha);
        if (isNaN(date)) return;
        const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
        if (!byMonth[key]) byMonth[key] = { ingreso: 0, gasto: 0 };
        const tipo = (m.tipo || '').toLowerCase();
        const monto = Number(m.monto) || 0;
        if (tipo === 'ingreso') byMonth[key].ingreso += monto;
        else if (tipo === 'gasto') byMonth[key].gasto += monto;
    });

    const months = Object.keys(byMonth).sort();
    const ingresos = months.map(k => byMonth[k].ingreso || 0);
    const gastos = months.map(k => byMonth[k].gasto || 0);

    const ctx = document.getElementById('finsaveComparisonChart');
    if (!ctx) return;

    const data = {
        labels: months,
        datasets: [
            { label: 'Ingresos', data: ingresos, borderColor: 'rgba(34,197,94,0.95)', backgroundColor: 'rgba(34,197,94,0.12)', tension: 0.2, pointRadius: 3 },
            { label: 'Gastos', data: gastos, borderColor: 'rgba(239,68,68,0.95)', backgroundColor: 'rgba(239,68,68,0.12)', tension: 0.2, pointRadius: 3 }
        ]
    };

    const options = {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { position: 'top' }, tooltip: { callbacks: { label(ctx){ return `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`; } } }, zoom: { pan:{enabled:true,mode:'x'}, zoom:{wheel:{enabled:true}, pinch:{enabled:true}, mode:'x'} } },
        scales: { x: { title: { display: true, text: 'Mes' } }, y: { ticks: { callback: v => formatCurrency(v) } } }
    };

    if (_finsaveChartInstance) {
        try {
            if (_finsaveChartInstance.canvas && _finsaveChartInstance.canvas === ctx) {
                _finsaveChartInstance.data = data;
                _finsaveChartInstance.options = options;
                _finsaveChartInstance.update();
                return;
            }
            _finsaveChartInstance.destroy();
            _finsaveChartInstance = null;
        } catch (e) {
            console.warn('Error updating/destroying previous chart instance', e);
            _finsaveChartInstance = null;
        }
    }

    _finsaveChartInstance = new Chart(ctx.getContext('2d'), { type: 'line', data, options });
}

function buildFloatingChartWidget(movimientos) {
    lastMovimientos = movimientos || [];
    // determine categories
    const cats = Array.from(new Set(lastMovimientos.map(m => extractCategoryFromMovimiento(m)))).sort();
    if (cats.length === 0) cats.push('otros');
    // initialize selectedCategories if first time
    if (selectedCategories === null) selectedCategories = new Set(cats);
    renderCategoryFilters(cats);
    populateYearMonthSelects(lastMovimientos);
    rebuildFloatingChart();
}

// ---------------- Toggle button for comparative widget ----------------
function createComparativeToggleButton() {
    if (document.getElementById('finsaveComparativeBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'finsaveComparativeBtn';
    btn.title = 'Mostrar comparativa';
    btn.textContent = 'Comparativa';
    Object.assign(btn.style, {
        position: 'fixed', left: '18px', bottom: '18px', zIndex: 99999,
        background: '#0ea5a4', color: 'white', border: 'none', padding: '10px 14px', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 6px 18px rgba(0,0,0,0.12)'
    });
    document.body.appendChild(btn);

    btn.addEventListener('click', async () => {
        const existing = document.getElementById('finsaveChartWidget');
        if (existing) {
            try { if (_finsaveChartInstance) { _finsaveChartInstance.destroy(); _finsaveChartInstance = null; } } catch (e) { console.warn('Error destroying chart', e); }
            existing.remove();
            return;
        }

        if (lastMovimientos && lastMovimientos.length > 0) {
            buildFloatingChartWidget(lastMovimientos);
            return;
        }

        try {
            await verHistorial();
        } catch (e) {
            console.warn('No se pudo cargar historial para comparativa', e);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    try { createComparativeToggleButton(); } catch (e) { console.warn('Could not create comparative button', e); }
});

// ---------------- API helpers ----------------
async function getCuentaIdFromEmail(email) {
    const res = await fetch(`/cuenta-por-email/${encodeURIComponent(email)}`, {
        headers: { ...authHeaders() }
    });
    if (!res.ok) {
        const err = await readJson(res);
        throw new Error(err.message || 'No se pudo obtener la cuenta por email');
    }
    const data = await res.json();
    localStorage.setItem('cuentaId', data.cuentaId);
    localStorage.setItem('clienteId', data.clienteId);
    return data.cuentaId;
}

async function verHistorial() {
    try {
        const res = await fetch('/historial-mio', { headers: { ...authHeaders() } });
        if (!res.ok) throw new Error('Error al cargar historial');
        const movimientos = await res.json();
        const tbody = document.getElementById("tablaCuerpo");
        tbody.innerHTML = "";
        movimientos.forEach(m => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${m.tipo}</td>
                <td>${formatCurrency(m.monto)}</td>
                <td>${new Date(m.fecha).toLocaleDateString()}</td>
                <td>${m.descripcion || ""}</td>
                <td>
                    <button class="btn-editar" data-id="${m._id}">✏️</button>
                    <button class="btn-eliminar" data-id="${m._id}">❌</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        updateChartFromMovements(movimientos);
        checkAchievements(movimientos);
        lastMovimientos = movimientos;
    } catch (err) {
        alert(err.message || 'Error al cargar historial');
    }
}


// Evento para eliminar movimiento
document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('btn-eliminar')) {
        const id = e.target.dataset.id;
        if (!confirm('¿Seguro que quieres eliminar este movimiento?')) return;
        const res = await fetch(`/movimientos/${id}`, {
            method: 'DELETE',
            headers: { ...authHeaders() }
        });
        if (!res.ok) {
            alert('Error al eliminar movimiento');
            return;
        }
        await verHistorial(); // Recarga la tabla
    }
});

// Abrir modal al hacer click en "Editar"
// document.addEventListener('click', (e) => {
//     if (e.target.classList.contains('btn-editar')) {
//         const id = e.target.dataset.id;
//         const movimiento = Array.from(document.querySelectorAll("#tablaCuerpo tr"))
//             .map(tr => ({
//                 id: tr.querySelector('.btn-editar').dataset.id,
//                 tipo: tr.cells[0].textContent,
//                 monto: parseFloat(tr.cells[1].textContent.replace('$','')),
//                 fecha: tr.cells[2].textContent,
//                 descripcion: tr.cells[3].textContent
//             }))
//             .find(m => m.id === id);
//         if (!movimiento) return;
//         document.getElementById('editId').value = movimiento.id;
//         document.getElementById('editTipo').value = movimiento.tipo;
//         document.getElementById('editMonto').value = movimiento.monto;
//         document.getElementById('editFecha').value = movimiento.fecha.split('/').reverse().join('-'); // formato yyyy-mm-dd
//         document.getElementById('editDescripcion').value = movimiento.descripcion;
//         document.getElementById('editModal').style.display = 'block';
//     }
// });

// Abrir modal al hacer click en "Editar"
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-editar')) {
        const id = e.target.dataset.id;
        const movimiento = Array.from(document.querySelectorAll("#tablaCuerpo tr"))
            .map(tr => {
                const idBtn = tr.querySelector('.btn-editar')?.dataset.id;
                const tipo = tr.cells[0]?.textContent?.trim() || '';
                const montoText = tr.cells[1]?.textContent?.trim() || '';
                // parse moneda de forma robusta (maneja €/$, separadores miles y decimales ,/.)
                const parseCurrency = (s) => {
                    const cleaned = (s || '').replace(/[^\d\-,.]/g, '').trim();
                    if (!cleaned) return NaN;
                    const hasComma = cleaned.indexOf(',') !== -1;
                    const hasDot = cleaned.indexOf('.') !== -1;
                    if (hasComma && hasDot) {
                        // si la última coma viene después del último punto -> coma decimal
                        if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
                            return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
                        } else {
                            // punto decimal, comas como miles
                            return parseFloat(cleaned.replace(/,/g, ''));
                        }
                    } else if (hasComma) {
                        return parseFloat(cleaned.replace(',', '.'));
                    } else {
                        return parseFloat(cleaned);
                    }
                };
                const monto = parseCurrency(montoText);

                const fechaText = tr.cells[2]?.textContent?.trim() || '';
                // parse fecha display -> yyyy-mm-dd para input[type=date]
                const parseDisplayDate = (s) => {
                    if (!s) return '';
                    // ya en formato yyyy-mm-dd
                    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
                    // formatos dd/mm/yyyy o dd-mm-yyyy o dd.mm.yyyy
                    const m = s.match(/^\s*(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})\s*$/);
                    if (m) {
                        const dd = m[1].padStart(2, '0');
                        const mm = m[2].padStart(2, '0');
                        const yyyy = m[3];
                        return `${yyyy}-${mm}-${dd}`;
                    }
                    // intentar Date.parse y convertir
                    const d = new Date(s);
                    if (!isNaN(d)) return d.toISOString().slice(0, 10);
                    return '';
                };
                const fecha = parseDisplayDate(fechaText);

                const descripcion = tr.cells[3]?.textContent?.trim() || '';
                return { id: idBtn, tipo, monto, fecha, descripcion };
            })
            .find(m => m.id === id);
        if (!movimiento) return;
        document.getElementById('editId').value = movimiento.id;
        document.getElementById('editTipo').value = movimiento.tipo;
        // solo asignar monto si es número válido
        document.getElementById('editMonto').value = Number.isFinite(movimiento.monto) ? movimiento.monto : '';
        // solo asignar fecha si el parseo devolvió una cadena yyyy-mm-dd válida
        if (movimiento.fecha) {
            document.getElementById('editFecha').value = movimiento.fecha;
        } else {
            document.getElementById('editFecha').value = '';
        }
        document.getElementById('editDescripcion').value = movimiento.descripcion;
        document.getElementById('editModal').style.display = 'block';
    }
});

// Guardar cambios
document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editId').value;
    const tipo = document.getElementById('editTipo').value;
    const monto = parseFloat(document.getElementById('editMonto').value);
    const fecha = document.getElementById('editFecha').value;
    const descripcion = document.getElementById('editDescripcion').value;

    const res = await fetch(`/movimientos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ tipo, monto, fecha, descripcion })
    });
    if (!res.ok) {
        alert('Error al editar movimiento');
        return;
    }
    document.getElementById('editModal').style.display = 'none';
    await verHistorial();
});

// Cancelar edición
document.getElementById('cancelEdit').addEventListener('click', () => {
    document.getElementById('editModal').style.display = 'none';
});




// ---------------- Events: nav/logout ----------------
document.getElementById("logoutBtnHeader").addEventListener("click", () => {
    clearToken();
     localStorage.removeItem("userName"); 
    google.accounts.id.disableAutoSelect();
    showLogin();

      const span = document.getElementById("bienvenido-user");
    if (span) span.remove();
});
document.getElementById("logoutBtnLogros").addEventListener("click", () => {
    clearToken();
      localStorage.removeItem("userName");
    google.accounts.id.disableAutoSelect();
    showLogin();
});
document.getElementById("logrosLinkHeader").addEventListener("click", (e) => { e.preventDefault(); showLogros(); });
document.getElementById("volverLink").addEventListener("click", (e) => { e.preventDefault(); showApp(); });
document.getElementById("btnVerHistorial").addEventListener("click", verHistorial);

// ---------------- Eventos: nuevo movimiento (PROTEGIDO) ----------------
document.getElementById("nuevoRegistro").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
        // get my account id from token
        const rCuenta = await fetch('/cuenta-mia', { headers: { ...authHeaders() } });
        if (!rCuenta.ok) throw new Error('No se pudo obtener la cuenta');
        const { cuentaId } = await rCuenta.json();

        const monto = parseFloat(document.getElementById("inputMonto").value);
        const tipo  = document.getElementById("objeto").value;
        const titulo = document.getElementById("inputTitulo").value.trim();
        const tag = document.getElementById("tag").value;
        const fecha = document.getElementById("start").value;
        const descripcion = `${tag} - ${titulo}`;

        if (monto >= 10000 && tipo === "ingreso") animacion1();
        if (monto >= 10000 && tipo === "gasto")   animacion2();

        let res = await fetch('/movimientos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify({ idCuenta: cuentaId, tipo, monto, descripcion, fecha })
        });

        if (res.status === 409) {
            const ok = confirm('Este movimiento ya existe. ¿Está seguro de querer añadirlo?');
            if (!ok) return;
            res = await fetch('/movimientos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ idCuenta: cuentaId, tipo, monto, descripcion, fecha, force: true })
            });
        }

        if (!res.ok) {
            const err = await readJson(res);
            throw new Error(err.message || 'No se pudo guardar el movimiento');
        }

        e.target.reset();
        bootstrap.Modal.getInstance(document.getElementById('movModal')).hide();
        await verHistorial(); // reload table for the logged-in user
    } catch (err) {
        alert(err.message || 'Error al guardar');
    }
});


//Animación de bicho azul boliforme
    const canvas = document.getElementById("lienzo");
    const ctx = canvas.getContext("2d");
    const img1 = new Image();
    const img2 = new Image();
    const img3 = new Image();
    const img4 = new Image();
    const img5 = new Image();
    const img6 = new Image();
    const img7 = new Image();
    const img8 = new Image();
    const img9 = new Image();
    const img10 = new Image();
    const img11 = new Image();
    const img12 = new Image();

    img1.src = "animation/finsavePet1.png";
    img2.src = "animation/finsavePet2.png";
    img3.src = "animation/finsavePet3.png";
    img4.src = "animation/finsavePet4.png";
    img5.src = "animation/finsavePet5.png";
    img6.src = "animation/finsavePet6.png";
    img7.src = "animation/finsavePet7.png";
    img8.src = "animation/finsavePet8.png";
    img9.src = "animation/finsavePet9.png";
    img10.src = "animation/finsavePet10.png";
    img11.src = "animation/finsavePet11.png";
    img12.src = "animation/finsavePet12.png";

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

    async function animacion1() {
        let frames = [img1, img2, img3, img4, img5, img6, img7, img8];
        let index = 0;
        const frameRate = 2; // frames por segundo

        function draw() {
            if (index >= frames.length) return; // termina

            const img = frames[index];
            if (img.complete) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                index++;
                setTimeout(() => requestAnimationFrame(draw), 1000 / frameRate);
            } else {
                // Esperar a que cargue
                img.onload = () => draw();
            }
        }

        draw();
        await delay(3000);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    async function animacion2() {
        let frames = [img1, img2, img3, img4, img10, img11, img12];
        let index = 0;
        const frameRate = 2; // frames por segundo

        function draw() {
            if (index >= frames.length) return; // termina

            const img = frames[index];
            if (img.complete) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                index++;
                setTimeout(() => requestAnimationFrame(draw), 1000 / frameRate);
            } else {
                // Esperar a que cargue
                img.onload = () => draw();
            }
        }

        draw();
        await delay(3000);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }



// ---------------- Filtros de tabla ----------------
const btnFiltro = document.getElementById('botonFiltro');
const filtroMonto = document.getElementById('montoFilterClass');
const filtroPrecio = document.getElementById('precioFilterClass');
const btnAplicarFiltro = document.getElementById('aplicarFiltro');
const btnLimpiarFiltro = document.getElementById('limpiarFiltro');

function alternarFiltros() { filtroMonto.classList.toggle('filtrosVisibles'); filtroPrecio.classList.toggle('filtrosVisibles'); }
function limpiarFiltrosUI() {
    document.getElementById('filtroMonto').value = 'predeterminado';
    document.getElementById('PrecioMínimo').value = '';
    document.getElementById('PrecioMáximo').value = '';
    verHistorial();
}
function aplicarFiltros() {
    const tipoSeleccionado = document.getElementById('filtroMonto').value;
    const precioMinimo = parseFloat(document.getElementById('PrecioMínimo').value);
    const precioMaximo = parseFloat(document.getElementById('PrecioMáximo').value);

    const filas = document.querySelectorAll('#tablaCuerpo tr');
    filas.forEach(fila => {
        const descripcion = fila.cells[3].textContent.toLowerCase();
      const monto = parseFloat(fila.cells[1].textContent.replace(/[^0-9.-]/g, ''));


        let mostrar = true;
        if (tipoSeleccionado !== 'predeterminado' && !descripcion.startsWith(tipoSeleccionado.toLowerCase())) mostrar = false;
        if (!isNaN(precioMinimo) && monto < precioMinimo) mostrar = false;
        if (!isNaN(precioMaximo) && monto > precioMaximo) mostrar = false;

        fila.style.display = mostrar ? '' : 'none';
    });
}
btnFiltro.addEventListener('click', alternarFiltros);
btnAplicarFiltro.addEventListener('click', aplicarFiltros);
btnLimpiarFiltro.addEventListener('click', limpiarFiltrosUI);

// ---------------- Ordenar tabla ----------------
document.querySelectorAll("th").forEach((th, index) => {
    th.style.cursor = "pointer";
    th.addEventListener("click", () => {
        const tbody = document.getElementById("tablaCuerpo");
        const rows = Array.from(tbody.querySelectorAll("tr"));
        const asc = th.classList.toggle("asc");

        document.querySelectorAll("th").forEach(h => {
            if (h !== th) {
                h.classList.remove("asc");
                h.textContent = h.textContent.replace(" ▲", "").replace(" ▼", "");
            }
        });

        rows.sort((a, b) => {
            const cellA = a.children[index].textContent.trim();
            const cellB = b.children[index].textContent.trim();
            const numA = parseFloat(cellA.replace(/[^\d.-]/g, ""));
            const numB = parseFloat(cellB.replace(/[^\d.-]/g, ""));
            const dateA = new Date(cellA);
            const dateB = new Date(cellB);

            let valA = (!isNaN(numA)) ? numA : (!isNaN(dateA) ? dateA : cellA);
            let valB = (!isNaN(numB)) ? numB : (!isNaN(dateB) ? dateB : cellB);

            if (valA < valB) return asc ? -1 : 1;
            if (valA > valB) return asc ? 1 : -1;
            return 0;
        });

        th.textContent = th.textContent.replace(" ▲", "").replace(" ▼", "") + (asc ? " ▲" : " ▼");
        tbody.innerHTML = "";
        rows.forEach(row => tbody.appendChild(row));
    });
});

// =================== EXPORTAR TODO EL HISTORIAL A CSV ===================
document.getElementById('exportBtn').addEventListener('click', async () => {
    try {
        const res = await fetch('/historial-mio', { headers: { ...authHeaders() } });
        if (!res.ok) throw new Error('No se pudo obtener el historial');
        const movimientos = await res.json();

        let csvContent = 'Tipo,Monto,Fecha,Descripción\n';
        movimientos.forEach(m => {
            csvContent += `"${m.tipo}","${formatCurrency(m.monto)}"
,"${new Date(m.fecha).toLocaleDateString()}","${m.descripcion || ''}"\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'historial_completo.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        completeAchievement(10);
    } catch (err) {
        alert(err.message || "Error al exportar historial");
    }
});


// ---------------- Logros: botones ----------------
document.getElementById('reset-btn').addEventListener('click', resetAchievements);
updateAchievementsUI();

// ---------------- Registro (real) ----------------
document.getElementById("registroForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nombre = document.getElementById("nombreRegistro").value.trim();
    const correo = document.getElementById("emailRegistro").value.trim().toLowerCase();
    const password = document.getElementById("passwordRegistro").value;
    const msg = document.getElementById("registroMsg");

    const res = await fetch("/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, correo, password })
    });
    const data = await readJson(res);

    if (res.status === 201) {
        msg.textContent = "¡Registro exitoso! Ahora puedes iniciar sesión.";
        msg.className = "mb-3 text-success";
        e.target.reset();
        document.getElementById('login-tab').click();
    } else if (res.status === 409) {
        msg.textContent = "Ese correo ya está registrado.";
        msg.className = "mb-3 text-danger";
    } else {
        msg.textContent = data.message || "Error en registro";
        msg.className = "mb-3 text-danger";
    }
});

// ---------------- Login (real) ----------------
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const correo = document.getElementById("emailLogin").value.trim().toLowerCase();
    const password = document.getElementById("passwordLogin").value;
    const loginMsg = document.getElementById("loginMsg");

    try {
        const res = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo, password })
        });
        const data = await readJson(res);

        if (!res.ok) {
            loginMsg.textContent = data.message || "Credenciales inválidas";
            loginMsg.className = "mb-3 text-danger";
            return;
        }

        clearToken();
        setToken(data.token);
        localStorage.setItem("userName", data.nombre);
        loginMsg.textContent = "";
        showApp();
        mostrarBienvenida();
        onUserLogin(data.token);
        verHistorial();
    } catch (err) {
        loginMsg.textContent = "Error de conexión con el servidor";
        loginMsg.className = "mb-3 text-danger";
    }
});


// ---------------- BIENVENIDA ----------------
function mostrarBienvenida() {
    const nombre = localStorage.getItem("userName") || "Usuario";
    const navbar = document.querySelector("header nav");
    const currentLang = localStorage.getItem("lang") || "es";
    
    const welcomeText = translations[currentLang].welcome + nombre + "!";
    
    if (!document.getElementById("bienvenido-user")) {
        const span = document.createElement("span");
        span.id = "bienvenido-user";
        span.textContent = welcomeText;
        span.classList.add("text-blue-600", "font-semibold", "ml-4");
        navbar.appendChild(span);
    } else {
        document.getElementById("bienvenido-user").textContent = welcomeText;
    }
}
// ---------------- PROFILE DATA ----------------
function loadUserProfile() {
    const name = localStorage.getItem("userName") || "Usuario";
    const email = localStorage.getItem("userEmail") || "";
    const since = localStorage.getItem("memberSince") || new Date().toISOString().split("T")[0];

    document.getElementById("profileName").value = name;
    document.getElementById("profileEmail").value = email;
    document.getElementById("profileSince").textContent = since;

    // Iniciales en el header
    const initials = name.split(" ").map(x => x[0]).join("").toUpperCase();
    document.getElementById("userAvatar").textContent = initials;
}

function saveUserProfile() {
    const name = document.getElementById("profileName").value;
    const email = document.getElementById("profileEmail").value;

    localStorage.setItem("userName", name);
    localStorage.setItem("userEmail", email);

    mostrarBienvenida();
    loadUserProfile();
}



// ---------------- Feedback form (FIXED) ----------------
(function initFeedback() {
    const form = document.getElementById('feedbackForm');
    const mensaje = document.getElementById('mensaje');
    if (!form || !mensaje) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        mensaje.classList.remove('hidden');
        form.reset();
    });
})();

// ---------------- Google Sign-In ----------------
window.onload = function () {
    google.accounts.id.initialize({
        client_id: "805821028145-30k2eot8omv2nf5rq0bm7ua2k6apvob0.apps.googleusercontent.com",
        callback: handleCredentialResponse
    });

    google.accounts.id.renderButton(
        document.getElementById("googleSignInDiv"),
        {
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "pill",
            logo_alignment: "center"
        }
    );
};
// ---------------- Mostrar/Ocultar Contraseña ----------------
document.addEventListener("DOMContentLoaded", () => {

    // ---------------- Mostrar/Ocultar Contraseña ----------------
    const togglePasswordElement = document.getElementById("togglePassword");
    if (togglePasswordElement) {
        togglePasswordElement.addEventListener("click", () => {
            const passwordInput = document.getElementById("passwordLogin");
            const icon = document.getElementById("togglePasswordIcon");
            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                icon.classList.remove("bi-eye");
                icon.classList.add("bi-eye-slash");
            } else {
                passwordInput.type = "password";
                icon.classList.remove("bi-eye-slash");
                icon.classList.add("bi-eye");
            }
        });
    }

    // ---------------- Mostrar/Ocultar Contraseña Registro ----------------
    const togglePasswordRegistroElement = document.getElementById("togglePasswordRegistro");
    if (togglePasswordRegistroElement) {
        togglePasswordRegistroElement.addEventListener("click", () => {
            const passwordInput = document.getElementById("passwordRegistro");
            const icon = document.getElementById("togglePasswordRegistroIcon");
            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                icon.classList.remove("bi-eye");
                icon.classList.add("bi-eye-slash");
            } else {
                passwordInput.type = "password";
                icon.classList.remove("bi-eye-slash");
                icon.classList.add("bi-eye");
            }
        });
    }

});

async function handleCredentialResponse(response) {
    try {
        const jwt = response.credential;
        setToken(jwt);
        alert("Inicio de sesión con Google exitoso!");
        showApp();
        mostrarBienvenida();
        onUserLogin(jwt);
        await verHistorial();
    } catch (err) {
        console.error(err);
        alert("Error en autenticación con Google");
    }
}

document.getElementById("homeBtnHeader").addEventListener("click", () => {
    // Si tienes sección de login, app y logros como antes:
    loginSection.classList.add("hidden");
    appSection.classList.add("hidden");
    logrosSection.classList.add("hidden");

    // Redirige al index.html (home)
    window.location.href = "index.html";
});

// === live prices panel ===
(() => {
    const statusEl = document.getElementById('lp-status');
    const listEl   = document.getElementById('lp-list');
    const form     = document.getElementById('lp-form');
    const input    = document.getElementById('lp-symbols');
    const btnClear = document.getElementById('lp-clear');

    if (!statusEl || !listEl || !form) return; // page safety

    // Connect to your proxy (same origin)
    const wsProto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${wsProto}//${location.host}/stream`);

    // Keep last price per symbol so we can show ↑/↓
    const state = new Map(); // symbol -> { price, el }

    function renderRow(symbol, price) {
        let item = state.get(symbol)?.el;
        const prev = state.get(symbol)?.price;
        const hasPrev = typeof prev === 'number';

        // Create DOM row if it doesn't exist
        if (!item) {
            item = document.createElement('div');
            item.className = 'list-group-item d-flex justify-content-between align-items-center';
            item.innerHTML = `
        <div class="fw-semibold">${symbol}</div>
        <div class="d-flex align-items-center gap-2">
          <span class="lp-price"></span>
          <span class="lp-delta badge rounded-pill"></span>
        </div>
      `;
            listEl.appendChild(item);
            state.set(symbol, { price, el: item });
        }

        // Update price
        item.querySelector('.lp-price').textContent = Number(price).toFixed(4);

        // Update delta badge
        const deltaEl = item.querySelector('.lp-delta');
        if (hasPrev) {
            const diff = Number(price) - prev;
            const up = diff > 0;
            const flat = diff === 0;
            deltaEl.textContent = flat ? '—' : (up ? `↑ ${diff.toFixed(4)}` : `↓ ${Math.abs(diff).toFixed(4)}`);
            deltaEl.className = `lp-delta badge rounded-pill ${flat ? 'bg-secondary' : (up ? 'bg-success' : 'bg-danger')}`;
        } else {
            deltaEl.textContent = 'new';
            deltaEl.className = 'lp-delta badge rounded-pill bg-secondary';
        }

        // Save latest
        state.set(symbol, { price: Number(price), el: item });
    }

    ws.addEventListener('open', () => {
        statusEl.textContent = 'Connected';
        // Optional default
        ws.send(JSON.stringify({ action: 'subscribe', params: { symbols: 'BTC/USD' }}));
    });

    ws.addEventListener('message', (ev) => {
        let msg;
        try { msg = JSON.parse(ev.data); } catch { return; }

        if (msg.event === 'price') {
            renderRow(msg.symbol, msg.price);
        } else if (msg.event === 'subscribe-status') {
            const ok = (msg.success || []).map(s => s.symbol).join(', ');
            statusEl.textContent = ok ? `Subscribed: ${ok}` : 'Subscribed';
        } else if (msg.event === 'error') {
            statusEl.textContent = `Error: ${msg.message || 'unknown'}`;
        }
    });

    ws.addEventListener('close', () => statusEl.textContent = 'Disconnected');
    ws.addEventListener('error', () => statusEl.textContent = 'Socket error');

    // Subscribe from form
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const symbols = (input.value || '').trim().toUpperCase();
        if (!symbols) return;
        ws.send(JSON.stringify({ action: 'subscribe', params: { symbols } }));
        input.value = '';
    });

    // Unsubscribe all (and clear UI)
    btnClear?.addEventListener('click', () => {
        ws.send(JSON.stringify({ action: 'reset' })); // Twelve Data supports reset to drop all subs
        listEl.innerHTML = '';
        state.clear();
        statusEl.textContent = 'Cleared subscriptions';
    });

    // BOTONES DEL PERFIL
document.getElementById("saveProfileBtn").addEventListener("click", saveUserProfile);

// SELECT CAMBIAR IDIOMA
document.getElementById("langSelect").addEventListener("change", (e) => {
    setLanguage(e.target.value);
});

// SELECT CAMBIAR MONEDA
document.getElementById("currencySelect").addEventListener("change", (e) => {
    setCurrency(e.target.value);
});

// Cargar perfil e idioma al iniciar
window.addEventListener("load", () => {
    translatePage();
    loadUserProfile();
});

});

