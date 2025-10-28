// ---- Hero Parallax ----
const heroImage = document.querySelector('.hero-image');
window.addEventListener('scroll', () => {
    if (heroImage) {
        const offset = window.scrollY * 0.25;
        heroImage.style.transform = `translateY(${offset}px)`;
        heroImage.style.opacity = 1 - window.scrollY / 800;
    }
});

// ---- Mascota flotante (seguimiento suave del cursor) ----
const mascota = document.getElementById('mascotaFloat');
let mouseX = 0, mouseY = 0, posX = 0, posY = 0;
const speed = 0.07;

window.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function animateMascota() {
    posX += (mouseX - posX) * speed;
    posY += (mouseY - posY) * speed;
    if (mascota) mascota.style.transform = `translate(${posX * 0.05}px, ${posY * 0.05}px)`;
    requestAnimationFrame(animateMascota);
}
animateMascota();

// ---- ScrollReveal Animations ----
ScrollReveal().reveal('.hero-title', { delay: 200, origin: 'top', distance: '50px', duration: 1000 });
ScrollReveal().reveal('.hero-desc', { delay: 400, origin: 'bottom', distance: '30px', duration: 1000 });
ScrollReveal().reveal('.feature-card', { interval: 200, origin: 'bottom', distance: '30px', duration: 900, scale: 0.95 });
