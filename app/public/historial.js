const listaFeedbacks = document.getElementById('lista-feedbacks');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('errorMessage');
const logoutBtn = document.getElementById('logoutBtnHistorial');

// Redirección si no hay sesión
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = "index.html";
}

// Cargar historial al abrir la página
document.addEventListener('DOMContentLoaded', function() {
    cargarHistorial();
});

// Función para cargar feedbacks del localStorage
function cargarHistorial() {
    loadingDiv.style.display = 'block';
    errorDiv.style.display = 'none';

    try {
        const feedbacks = JSON.parse(localStorage.getItem('feedbacks')) || [];
        mostrarFeedbacks(feedbacks);
    } catch (err) {
        mostrarError('Error al cargar el historial: ' + err.message);
    } finally {
        loadingDiv.style.display = 'none';
    }
}

// Función para mostrar los feedbacks en la lista
function mostrarFeedbacks(feedbacks) {
    if (feedbacks.length === 0) {
        listaFeedbacks.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="bi bi-inbox display-4"></i>
                <p class="mt-2">No hay feedbacks enviados aún</p>
            </div>
        `;
        return;
    }

    listaFeedbacks.innerHTML = feedbacks.map(feedback => `
        <div class="feedback-item bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
            <div class="flex justify-between items-start mb-2">
                <p class="text-gray-700">${feedback.comentario}</p>
                <span class="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    ${new Date(feedback.fecha).toLocaleDateString('es-ES')}
                </span>
            </div>
        </div>
    `).join('');
}

// Función para mostrar errores
function mostrarError(mensaje) {
    errorDiv.textContent = mensaje;
    errorDiv.style.display = 'block';
}

// Logout
logoutBtn.addEventListener('click', function() {
    localStorage.removeItem('token');
    window.location.href = "index.html";
});
