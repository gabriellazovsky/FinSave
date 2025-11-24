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

        // Texto traducible simple
        const noFeedbacksText = document.createElement('div');
        noFeedbacksText.id = 'noFeedbacksMessage';
        noFeedbacksText.className = 'text-center text-gray-500 py-8';
        noFeedbacksText.innerHTML = `
            <i class="bi bi-inbox display-4"></i>
            <p class="mt-2" data-i18n="feedback.no_feedbacks">No hay feedbacks enviados aún</p>
        `;
        
        container.appendChild(noFeedbacksText);
        
        // Forzar traducción del nuevo elemento
        if (typeof translatePage === 'function') {
            translatePage();
        }
        return;
    }

    const noFeedbacksMessage = document.getElementById('noFeedbacksMessage');
    if(noFeedbacksMessage) noFeedbacksMessage.remove();
    listaFeedbacks.parentElement.style.display = 'table';

    listaFeedbacks.innerHTML = reversedFeedbacks.map(feedback => {
        // Crear fila con data-i18n para que translations.js la traduzca
        const tipoKey = getTranslationKeyForTipo(feedback.tipo);
        
        return `
        <tr>
            <td><span data-i18n="${tipoKey}">${feedback.tipo || ''}</span></td>
            <td>${feedback.comentario || ''}</td>
            <td>${new Date(feedback.fecha).toLocaleDateString('es-ES') || ''}</td>
        </tr>
        `;
    }).join('');
    
    // Forzar traducción de todas las filas
    if (typeof translatePage === 'function') {
        translatePage();
    }
}

// Función para mapear tipos de feedback a keys de traducción
function getTranslationKeyForTipo(tipo) {
    const mapping = {
        'sugerencia': 'feedback.suggestion',
        'bug': 'feedback.bug_report',
        'general': 'feedback.general'
    };
    return mapping[tipo] || 'feedback.general';
}

function mostrarError(mensaje) {
    errorDiv.textContent = mensaje;
    errorDiv.style.display = 'block';
}

logoutBtn.addEventListener('click', function() {
    localStorage.removeItem('token');
    window.location.href = "persona.html";
});
