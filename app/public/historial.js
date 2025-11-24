const listaFeedbacks = document.getElementById('lista-feedbacks');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('errorMessage');
const logoutBtn = document.getElementById('logoutBtnHistorial');

const token = localStorage.getItem('token');
if (!token) window.location.href = "persona.html";

function getUserIdFromToken(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id || payload.userId || payload.uid;
    } catch {
        return null;
    }
}

const userId = getUserIdFromToken(token);
if (!userId) window.location.href = "persona.html";

const key = `feedbacks_${userId}`;

// Función para obtener traducciones
function getTranslation(key) {
    const currentLang = localStorage.getItem('lang') || 'es';
    // Asegúrate de que 'translations' esté disponible globalmente
    if (window.translations && window.translations[currentLang] && window.translations[currentLang][key]) {
        return window.translations[currentLang][key];
    }
    // Fallback en español
    const fallbackTranslations = {
        'feedback.no_feedbacks': 'No hay feedbacks enviados aún',
        'loading.historial': 'Cargando historial...'
    };
    return fallbackTranslations[key] || key;
}

document.addEventListener('DOMContentLoaded', function() {
    cargarHistorial();
});

function cargarHistorial() {
    loadingDiv.style.display = 'block';
    errorDiv.style.display = 'none';

    try {
        const feedbacks = JSON.parse(localStorage.getItem(key)) || [];
        mostrarFeedbacks(feedbacks);
    } catch (err) {
        mostrarError('Error al cargar el historial: ' + err.message);
    } finally {
        loadingDiv.style.display = 'none';
    }
}

function mostrarFeedbacks(feedbacks) {
    const reversedFeedbacks = [...feedbacks].reverse(); 
    listaFeedbacks.innerHTML = '';

    if (reversedFeedbacks.length === 0) {
        const parentTable = listaFeedbacks.parentElement;
        const container = parentTable.parentElement;

        parentTable.style.display = 'none';

        // USAR TRADUCCIÓN AQUÍ
        const noFeedbacksText = getTranslation('feedback.no_feedbacks');
        
        container.innerHTML += `
            <div id="noFeedbacksMessage" class="text-center text-gray-500 py-8">
                <i class="bi bi-inbox display-4"></i>
                <p class="mt-2">${noFeedbacksText}</p>
            </div>
        `;
        return;
    }

    const noFeedbacksMessage = document.getElementById('noFeedbacksMessage');
    if(noFeedbacksMessage) noFeedbacksMessage.remove();
    listaFeedbacks.parentElement.style.display = 'table';

    listaFeedbacks.innerHTML = reversedFeedbacks.map(feedback => `
        <tr>
            <td>${feedback.tipo || ''}</td>
            <td>${feedback.comentario || ''}</td>
            <td>${new Date(feedback.fecha).toLocaleDateString('es-ES') || ''}</td>
        </tr>
    `).join('');
}

function mostrarError(mensaje) {
    errorDiv.textContent = mensaje;
    errorDiv.style.display = 'block';
}

logoutBtn.addEventListener('click', function() {
    localStorage.removeItem('token');
    window.location.href = "persona.html";
});
