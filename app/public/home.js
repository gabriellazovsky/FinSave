// LIGHT/DARK TOGGLE
const checkbox = document.getElementById("checkbox");
checkbox?.addEventListener("change", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
});
if(localStorage.getItem("theme")==="dark"){document.body.classList.add("dark"); checkbox.checked=true;}

// HERO PARALLAX
const heroImage = document.querySelector('.hero-image');
window.addEventListener('scroll',()=>{if(heroImage) heroImage.style.transform=`translateY(${window.scrollY*0.2}px)`;});

// MASCOTA FOLLOW CURSOR
const mascota=document.getElementById('mascotaFloat'); let mouseX=0, mouseY=0, posX=0, posY=0, speed=0.1;
window.addEventListener('mousemove',e=>{mouseX=e.clientX; mouseY=e.clientY;});
function animateMascota(){posX+=(mouseX-posX)*speed; posY+=(mouseY-posY)*speed; if(mascota){mascota.style.transform=`translate(${posX-50}px, ${posY-50}px)`;} requestAnimationFrame(animateMascota);}
animateMascota();

// MASCOTAS FLOTANTES CON SCROLL
const mascotas = document.querySelectorAll('.floating-mascota');
window.addEventListener('scroll',()=>{
    mascotas.forEach((m,i)=>{
        const speed = 0.15 + i*0.05;
        m.style.transform = `translateY(${window.scrollY*speed - 50}%)`;
    });
});

// SCROLLREVEAL
if(typeof ScrollReveal!=="undefined"){
    ScrollReveal().reveal('.hero-title',{delay:200, origin:'top', distance:'50px', duration:1000});
    ScrollReveal().reveal('.hero-desc',{delay:400, origin:'bottom', distance:'30px', duration:1000});
    ScrollReveal().reveal('.feature-card',{interval:200, origin:'bottom', distance:'30px', duration:1000});
}
