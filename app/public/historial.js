// historial.js (Modificado)

const listaFeedbacks = document.getElementById('lista-feedbacks');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('errorMessage');
const logoutBtn = document.getElementById('logoutBtnHistorial');

// Redirección si no hay sesión
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = "persona.html";
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

// Función para mostrar los feedbacks en la tabla
function mostrarFeedbacks(feedbacks) {
    // Mostrar el más reciente primero
    const reversedFeedbacks = [...feedbacks].reverse(); 
    listaFeedbacks.innerHTML = ''; // Limpiar el tbody

    if (reversedFeedbacks.length === 0) {
        // Si no hay datos, mostramos un mensaje en lugar de la tabla
        const parentTable = listaFeedbacks.parentElement; // El <table>
        const container = parentTable.parentElement; // El div.feedback-container

        // Ocultar la tabla y mostrar el mensaje de vacío
        parentTable.style.display = 'none'; 
        container.innerHTML += `
            <div id="noFeedbacksMessage" class="text-center text-gray-500 py-8">
                <i class="bi bi-inbox display-4"></i>
                <p class="mt-2">No hay feedbacks enviados aún</p>
            </div>
        `;
        return;
    }
    
    // Si hay datos, nos aseguramos de que no aparezca el mensaje de vacío
    const noFeedbacksMessage = document.getElementById('noFeedbacksMessage');
    if(noFeedbacksMessage) noFeedbacksMessage.remove();
    listaFeedbacks.parentElement.style.display = 'table'; // Mostrar la tabla

    // Generar las filas de la tabla
    listaFeedbacks.innerHTML = reversedFeedbacks.map(feedback => `
        <tr>
            <td>${feedback.tipo || ''}</td>
            <td>${feedback.comentario || ''}</td>
            <td>${new Date(feedback.fecha).toLocaleDateString('es-ES') || ''}</td>
        </tr>
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
    window.location.href = "persona.html";
});