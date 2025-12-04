const feedbackForm = document.getElementById('feedbackForm');
const feedbackMessage = document.getElementById('feedbackMessage');

const logoutBtnFeedback = document.getElementById('logoutBtnHistorial') || document.getElementById('logoutBtnFeedback'); 

const token = localStorage.getItem('token');
if (!token) {
    window.location.href = "persona.html";
}

// 🔥 Obtener userId desde el token (MISMO sistema que ingresos/gastos)
function getUserIdFromToken(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id || payload.userId || payload.uid;
    } catch {
        return null;
    }
}

const userId = getUserIdFromToken(token);

if (!userId) {
    window.location.href = "persona.html";
}

const key = `feedbacks_${userId}`;

// Guardar feedback
if (feedbackForm) {
   feedbackForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const comentario = document.getElementById('comentario').value.trim();
    const tipo = document.getElementById('tipo').value;
    if (!comentario || !tipo) return;

    const feedbacks = JSON.parse(localStorage.getItem(key)) || [];

    feedbacks.push({
        comentario,
        tipo,
        fecha: new Date().toISOString()
    });

    localStorage.setItem(key, JSON.stringify(feedbacks));

    feedbackForm.reset();
    feedbackMessage.textContent = translations[currentLang]['feedbackSent'] || "¡Gracias! Tu Feedback ha sido enviado.";
    feedbackMessage.style.display = 'block';

    setTimeout(() => feedbackMessage.style.display = 'none', 5000);
});

}

if (logoutBtnFeedback) {
    logoutBtnFeedback.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = "persona.html";
    });
}
