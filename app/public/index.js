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

    function showLogin() { appSection.classList.add("hidden"); logrosSection.classList.add("hidden"); loginSection.classList.remove("hidden"); }
    function showApp()   { loginSection.classList.add("hidden"); logrosSection.classList.add("hidden"); appSection.classList.remove("hidden"); }
    function showLogros(){ loginSection.classList.add("hidden"); appSection.classList.add("hidden"); logrosSection.classList.remove("hidden"); }

    if (getToken()) showApp(); else showLogin();

    // ---------------- Achievements (unchanged core) ----------------
    let achievements = [
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

    function simulateAchievements() { achievements.forEach(a => { if (Math.random() < 0.6 && !a.completed) { a.completed = true; showAchievementNotification(a.name); } }); updateAchievementsUI(); }
    function resetAchievements() { achievements.forEach(a => a.completed = false); updateAchievementsUI(); }
    function completeAchievement(id) { const a = achievements.find(x => x.id === id); if (a && !a.completed) { a.completed = true; showAchievementNotification(a.name); updateAchievementsUI(); } }

    // ---------------- Chart helper ----------------
    function updateChartFromMovements(movimientos) {
        const groups = new Map();
        movimientos.forEach(m => {
            const desc = (m.descripcion || m.descripcion === 0) ? String(m.descripcion).trim() : '';
            let first = desc ? desc.split(/\s|-/)[0].replace(/^[^\w\p{L}]+|[^\w\p{L}]+$/gu, '') : 'Otros';
            if (!first) first = 'Otros';
            const monto = Number(m.monto) || 0;
            groups.set(first, (groups.get(first) || 0) + Math.abs(monto));
        });
        const arr = Array.from(groups.entries()).sort((a, b) => b[1] - a[1]);
        const total = arr.reduce((s, [, v]) => s + v, 0);
        const palette = ['#4CAF50', '#2196F3', '#FFC107', '#9C27B0', '#FF5722', '#00BCD4', '#8BC34A'];

        let gradientParts = [];
        let cumulative = 0;
        if (total > 0) {
            arr.forEach(([, amount], i) => {
                const percent = (amount / total) * 100;
                gradientParts.push(`${palette[i % palette.length]} ${cumulative}% ${cumulative + percent}%`);
                cumulative += percent;
            });
        } else {
            gradientParts = ['#4CAF50 0% 60%', '#2196F3 60% 85%', '#FFC107 85% 100%'];
        }
        const chart = document.querySelector('.chart-container'); if (chart) chart.style.background = `conic-gradient(${gradientParts.join(', ')})`;

        const ingresosBadge = document.querySelector('.badge.bg-success');
        const gastosBadge = document.querySelector('.badge.bg-primary');
        const ahorroBadge = document.querySelector('.badge.bg-warning');
        const labels = arr.map(a => a[0]);
        const percents = arr.map(a => Math.round((a[1] / Math.max(1, total)) * 100));
        if (ingresosBadge) ingresosBadge.textContent = labels[0] ? `${labels[0]} ${percents[0]}%` : 'Sin datos';
        if (gastosBadge) gastosBadge.textContent = labels[1] ? `${labels[1]} ${percents[1]}%` : (labels[0] ? '—' : 'Sin datos');
        if (ahorroBadge) ahorroBadge.textContent = labels[2] ? `${labels[2]} ${percents[2]}%` : (labels[1] ? '—' : 'Sin datos');
    }

    // ---------------- API helpers ----------------
    async function getCuentaIdFromCliente(clienteId) {
        const res = await fetch(`/cuenta-por-cliente/${clienteId}`, { headers: { ...authHeaders() } });
        if (!res.ok) throw new Error('No se pudo obtener la cuenta');
        const data = await res.json();
        localStorage.setItem('cuentaId', data.cuentaId);
        return data.cuentaId;
    }

    async function verHistorial() {
        try {
            const clienteIdInput = document.getElementById("clienteId");
            const clienteId = clienteIdInput.value.trim();
            if (!clienteId) return alert("Por favor, ingresa un ID de cliente");
            const cuentaId = await getCuentaIdFromCliente(clienteId);

            const res = await fetch(`/historial/${cuentaId}`, { headers: { ...authHeaders() } });
            if (!res.ok) throw new Error('Error al cargar historial');
            const movimientos = await res.json();

            const tbody = document.getElementById("tablaCuerpo");
            tbody.innerHTML = "";
            movimientos.forEach(m => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
          <td>${m.tipo}</td>
          <td>$${Number(m.monto).toFixed(2)}</td>
          <td>${new Date(m.fecha).toLocaleDateString()}</td>
          <td>${m.descripcion || ""}</td>
        `;
                tbody.appendChild(tr);
            });
            updateChartFromMovements(movimientos);
        } catch (err) {
            alert(err.message || 'Error al cargar historial');
        }
    }

    // ---------------- Events: nav/logout ----------------
    document.getElementById("logoutBtnHeader").addEventListener("click", () => { 
        clearToken(); 
        google.accounts.id.disableAutoSelect(); 
        showLogin(); 
    });
    document.getElementById("logoutBtnLogros").addEventListener("click", () => { 
    clearToken(); 
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
            const clienteId = document.getElementById("inputClienteId").value.trim();
            if (!clienteId) return alert("Falta ID Cliente");
            const cuentaId = await getCuentaIdFromCliente(clienteId);

            const monto = parseFloat(document.getElementById("inputMonto").value);
            const tipo  = document.getElementById("objeto").value;
            const titulo = document.getElementById("inputTitulo").value.trim();
            const tag = document.getElementById("tag").value;
            const fecha = document.getElementById("start").value;
            const descripcion = `${tag} - ${titulo}`;

            const res = await fetch('/movimientos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ idCuenta: cuentaId, tipo, monto, descripcion, fecha })
            });
            if (!res.ok) {
                const err = await readJson(res);
                throw new Error(err.message || 'No se pudo guardar el movimiento');
            }

            e.target.reset();
            bootstrap.Modal.getInstance(document.getElementById('movModal')).hide();
            await verHistorial();
        } catch (err) {
            alert(err.message || 'Error al guardar');
        }
    });

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
            const monto = parseFloat(fila.cells[1].textContent.replace('$', ''));

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

    // ---------------- Exportar CSV (simulación + logro) ----------------
    document.getElementById("exportBtn").addEventListener("click", () => {
        alert("CSV exportado exitosamente (simulación)");
        completeAchievement(10);
    });

    // ---------------- Logros: botones ----------------
    document.getElementById('simulate-btn').addEventListener('click', simulateAchievements);
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
        setToken(data.token);
        loginMsg.textContent = "";
        showApp();
    });

    // ---------------- Feedback form ----------------
    (function initFeedback() {
        const form = document.getElementById('feedbackForm');
        const mensaje = document.getElementById('mensaje');
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

    // Maneja la respuesta de Google
    async function handleCredentialResponse(response) {
     try {
     const jwt = response.credential;

      // Guardamos el token
      setToken(jwt);

      alert("Inicio de sesión con Google exitoso!");
        showApp();
      } catch (err) {
        console.error(err);
        alert("Error en autenticación con Google");
     }
    }