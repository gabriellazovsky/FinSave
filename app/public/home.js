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

// Feedback form (solo placeholder, sin enviar)
document.querySelectorAll('form').forEach(form => {
    form?.addEventListener('submit', e => {
        e.preventDefault();
        const msg = form.querySelector('span#mensaje');
        if (msg) msg.classList.remove('hidden');
        form.reset();
    });
});

// Animación de parallax hero-image según scroll
const heroImage = document.querySelector('.hero-image');
window.addEventListener('scroll', () => {
    if(heroImage){
        heroImage.style.transform = `translateY(${window.scrollY * 0.2}px)`;
    }
});
// Parallax hero image
const heroImage = document.querySelector('.hero-image');
window.addEventListener('scroll', () => {
    if(heroImage){
        heroImage.style.transform = `translateY(${window.scrollY * 0.2}px)`;
    }
});

// Mascotas flotantes
const mascotas = document.querySelectorAll('.floating-mascota');
window.addEventListener('scroll', () => {
    mascotas.forEach((m, i) => {
        const speed = 0.15 + i*0.05;
        m.style.transform = `translateY(${window.scrollY*speed - 50}%)`;
    });
});

