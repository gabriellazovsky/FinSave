// ---------------- Navbar ----------------
document.getElementById("logoutBtnHeader").addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    window.location.href = "login.html";
});

document.getElementById("homeBtnHeader").addEventListener("click", () => {
    window.location.href = "index.html";
});

// ---------------- Bienvenida ----------------
function mostrarBienvenida() {
    const nombre = localStorage.getItem("userName") || "";
    const span = document.getElementById("bienvenido-user");
    if (nombre && span) {
        span.textContent = `Bienvenido, ${nombre}!`;
    } else if(span) {
        span.textContent = "";
    }
}
mostrarBienvenida();

// ---------------- Feedback ----------------
document.getElementById('feedbackForm').addEventListener('submit', e => {
    e.preventDefault();
    document.getElementById('mensaje').classList.remove('hidden');
    e.target.reset();
});
