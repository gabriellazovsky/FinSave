// ---------------- Helpers ----------------
const getToken = () => localStorage.getItem("token");
const setToken = (t) => localStorage.setItem("token", t);
const clearToken = () => localStorage.removeItem("token");
const readJson = async (res) => { try { return await res.json(); } catch { return {}; } };

// ---------------- Login ----------------
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
        loginMsg.textContent = "¡Login exitoso!";
        loginMsg.className = "mb-3 text-success";

        // Redirigir a dashboard
        window.location.href = "/persona.html";
    } catch (err) {
        loginMsg.textContent = "Error de conexión con el servidor";
        loginMsg.className = "mb-3 text-danger";
    }
});

// ---------------- Registro ----------------
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

// ---------------- Google Sign-In ----------------
window.onload = function () {
    google.accounts.id.initialize({
        client_id: "805821028145-30k2eot8omv2nf5rq0bm7ua2k6apvob0.apps.googleusercontent.com",
        callback: handleCredentialResponse
    });

    google.accounts.id.renderButton(
        document.getElementById("googleSignInDiv"),
        { theme: "outline", size: "large", text: "signin_with", shape: "pill", logo_alignment: "center" }
    );
};

function handleCredentialResponse(response) {
    const jwt = response.credential;
    setToken(jwt);
    alert("Inicio de sesión con Google exitoso!");
    window.location.href = "/persona.html"; // Redirige al dashboard
}
