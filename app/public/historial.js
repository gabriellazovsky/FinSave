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

// Función para traducir tipos de feedback
function traducirTipoFeedback(tipo) {
    const currentLang = localStorage.getItem('lang') || 'es';
    
    const traducciones = {
        'sugerencia': { es: 'Sugerencia', en: 'Suggestion' },
        'bug': { es: 'Reporte de Error', en: 'Bug Report' },
        'general': { es: 'General', en: 'General' }
    };
    
    if (traducciones[tipo] && traducciones[tipo][currentLang]) {
        return traducciones[tipo][currentLang];
    }
    
    return tipo; // Fallback al tipo original
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
        // Traducir el tipo de feedback
        const tipoTraducido = traducirTipoFeedback(feedback.tipo || '');
        
        return `
        <tr>
            <td>${tipoTraducido}</td>
            <td>${feedback.comentario || ''}</td>
            <td>${new Date(feedback.fecha).toLocaleDateString('es-ES') || ''}</td>
        </tr>
        `;
    }).join('');
}

function mostrarError(mensaje) {
    errorDiv.textContent = mensaje;
    errorDiv.style.display = 'block';
}

logoutBtn.addEventListener('click', function() {
    localStorage.removeItem('token');
    window.location.href = "persona.html";
});
