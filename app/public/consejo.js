// DARK MODE - Soporta MÚLTIPLES toggles con la MISMA clase
document.addEventListener('DOMContentLoaded', () => {
  const toggles = document.querySelectorAll('.theme-switch__checkbox, .checkbox');
  
  function applyTheme(isDark) {
    document.body.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    toggles.forEach(t => t.checked = isDark);
  }

  // Event listeners para TODOS los toggles
  toggles.forEach(toggle => {
    toggle.addEventListener('change', () => applyTheme(toggle.checked));
  });

  // Carga estado inicial
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    applyTheme(true);
  }
});


