# FinSave
**Ahorra jugando, aprende creciendo**

Una aplicación web para el seguimiento de ahorros y educación financiera que te ayuda a alcanzar tus metas financieras de manera divertida e interactiva.

![FinSave Homepage](https://github.com/user-attachments/assets/138bdd65-360d-4da5-a8c2-ee6a3c5c9a0f)

## 🌟 Características

- **Dashboard de Ahorros**: Visualiza tu progreso total y estadísticas
- **Gestión de Ahorros**: Agrega y categoriza tus entradas de ahorro
- **Metas Financieras**: Establece y rastrea objetivos específicos
- **Centro de Aprendizaje**: Consejos y calculadora de ahorros
- **Interfaz Responsiva**: Diseño moderno con Bootstrap
- **Educación Financiera**: Tips y recursos para mejorar tus finanzas

![FinSave Goals](https://github.com/user-attachments/assets/ad072b2d-24a6-481e-b2ce-49b0ca9be651)

## 🚀 Inicio Rápido

### Prerrequisitos
- Python 3.7+
- pip (gestor de paquetes de Python)

### Instalación

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/gabriellazovsky/FinSave.git
   cd FinSave
   ```

2. **Instala las dependencias**
   ```bash
   pip install -r requirements.txt
   ```

3. **Ejecuta la aplicación**
   ```bash
   python app.py
   ```

4. **Abre tu navegador**
   Ve a `http://localhost:5000` para usar la aplicación

## 📱 Funcionalidades

### 🏠 Dashboard Principal
- Resumen total de ahorros
- Número de transacciones
- Progreso hacia metas mensuales
- Historial de ahorros recientes

### 💰 Gestión de Ahorros
- Agregar nuevas entradas de ahorro
- Categorización por tipo (emergencia, vacaciones, educación, etc.)
- Validación de formularios
- Mensajes de confirmación

### 🎯 Metas de Ahorro
- Crear metas personalizadas
- Seguimiento visual del progreso
- Estimación de tiempo para completar metas
- Sistema de logros y reconocimientos

### 📚 Centro de Aprendizaje
- Tips financieros prácticos
- Calculadora de ahorros con interés compuesto
- Recursos adicionales para educación financiera
- Reglas básicas de ahorro (50/30/20)

## 🛠️ Tecnologías Utilizadas

- **Backend**: Flask (Python)
- **Frontend**: HTML5, CSS3, JavaScript
- **Styling**: Bootstrap 5
- **Icons**: Font Awesome
- **Responsive Design**: Mobile-first approach

## 📂 Estructura del Proyecto

```
FinSave/
├── app.py                 # Aplicación principal Flask
├── requirements.txt       # Dependencias de Python
├── templates/            # Plantillas HTML
│   ├── base.html        # Plantilla base
│   ├── index.html       # Página principal
│   ├── add_savings.html # Formulario agregar ahorro
│   ├── learn.html       # Centro de aprendizaje
│   └── goals.html       # Metas de ahorro
├── static/              # Archivos estáticos
│   ├── css/
│   │   └── style.css    # Estilos personalizados
│   └── js/
│       └── app.js       # JavaScript de la aplicación
└── README.md           # Documentación
```

## 🔧 Configuración Avanzada

### Variables de Entorno
```bash
export SECRET_KEY="tu-clave-secreta-aqui"
export FLASK_ENV=development  # Para desarrollo
export FLASK_ENV=production   # Para producción
```

### Ejecutar en Modo Producción
```bash
# Instalar servidor WSGI
pip install gunicorn

# Ejecutar con Gunicorn
gunicorn --bind 0.0.0.0:8000 app:app
```

## 🧪 Testing

Para probar la aplicación, puedes usar el script de pruebas incluido:

```bash
# Asegúrate de que la aplicación esté ejecutándose
python app.py &

# En otra terminal, ejecuta las pruebas
python test_finsave.py
```

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Por favor:

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Roadmap

- [ ] Autenticación de usuarios
- [ ] Base de datos persistente
- [ ] Gráficos y reportes avanzados
- [ ] Exportación de datos
- [ ] API REST
- [ ] Aplicación móvil
- [ ] Integración con bancos
- [ ] Notificaciones push

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Autores

- **Gabriella Zovsky** - *Trabajo inicial* - [gabriellazovsky](https://github.com/gabriellazovsky)

## 🙏 Agradecimientos

- Bootstrap por el framework CSS
- Font Awesome por los iconos
- Flask community por la documentación
- Todos los contribuidores que hacen posible este proyecto

---

**¿Te gusta FinSave?** ⭐ ¡Dale una estrella al repositorio para apoyar el proyecto!
