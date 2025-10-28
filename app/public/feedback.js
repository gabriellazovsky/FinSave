
const feedbackForm = document.getElementById('feedbackForm');
const feedbackMessage = document.getElementById('feedbackMessage');

// Asumo que el botón de cerrar sesión en feedback.html tiene el ID 'logoutBtnHistorial' o 'logoutBtnFeedback'
const logoutBtnFeedback = document.getElementById('logoutBtnHistorial') || document.getElementById('logoutBtnFeedback'); 

// Redirección si no hay sesión
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = "persona.html";
}

// Escucha el envío del formulario
if (feedbackForm) {
    feedbackForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // 1. Recoger datos del formulario
        const comentario = document.getElementById('comentario').value.trim();
        const tipo = document.getElementById('tipo').value;
        
        // Validación mínima
        if (!comentario || !tipo) return;

        // 2. Crear el objeto de feedback
        const nuevoFeedback = {
            comentario: comentario, // El mensaje
            tipo: tipo,             // El tipo de feedback
            fecha: new Date().toISOString(),
        };

        // 3. Obtener el historial actual y añadir el nuevo feedback
        let feedbacks = [];
        try {
            feedbacks = JSON.parse(localStorage.getItem('feedbacks')) || []; 
        } catch (error) {
            console.error("Error al parsear feedbacks de localStorage:", error);
        }
        
        feedbacks.push(nuevoFeedback);

        // 4. Guardar el array actualizado en localStorage
        localStorage.setItem('feedbacks', JSON.stringify(feedbacks));

        // 5. Limpiar formulario 
        feedbackForm.reset();
        feedbackMessage.textContent = '¡Gracias! Tu Feedback ha sido enviado y guardado correctamente.';
        feedbackMessage.style.display = 'block';
    
        setTimeout(() => {
            feedbackMessage.style.display = 'none';
        
        }, 5000);
    });
}

// Logout del formulario
if (logoutBtnFeedback) {
    logoutBtnFeedback.addEventListener('click', function() {
        localStorage.removeItem('token');
        window.location.href = "persona.html";
    });
}