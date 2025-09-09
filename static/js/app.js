// FinSave App JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Auto-hide alerts after 5 seconds
    setTimeout(function() {
        var alerts = document.querySelectorAll('.alert');
        alerts.forEach(function(alert) {
            var bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        });
    }, 5000);

    // Form validation enhancement
    var forms = document.querySelectorAll('.needs-validation');
    forms.forEach(function(form) {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        });
    });

    // Currency formatting
    var currencyInputs = document.querySelectorAll('input[type="number"]');
    currencyInputs.forEach(function(input) {
        input.addEventListener('blur', function() {
            if (this.value) {
                this.value = parseFloat(this.value).toFixed(2);
            }
        });
    });

    // Smooth scrolling for anchor links
    var anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            var targetId = this.getAttribute('href').substring(1);
            var targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Loading states for buttons
    var submitButtons = document.querySelectorAll('button[type="submit"]');
    submitButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            var form = this.closest('form');
            if (form && form.checkValidity()) {
                this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
                this.disabled = true;
            }
        });
    });

    // Number animation for counters
    function animateNumber(element, target, duration = 1000) {
        var start = 0;
        var increment = target / (duration / 16);
        var current = start;
        
        var timer = setInterval(function() {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = current.toFixed(2);
        }, 16);
    }

    // Animate numbers on page load
    var numberElements = document.querySelectorAll('.animate-number');
    numberElements.forEach(function(element) {
        var target = parseFloat(element.textContent);
        if (!isNaN(target)) {
            animateNumber(element, target);
        }
    });

    // Progressive Web App features
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('/static/js/sw.js')
                .then(function(registration) {
                    console.log('ServiceWorker registration successful');
                })
                .catch(function(err) {
                    console.log('ServiceWorker registration failed');
                });
        });
    }

    // Local storage for form data
    function saveFormData(formId) {
        var form = document.getElementById(formId);
        if (form) {
            var formData = new FormData(form);
            var data = {};
            for (var [key, value] of formData.entries()) {
                data[key] = value;
            }
            localStorage.setItem(formId, JSON.stringify(data));
        }
    }

    function loadFormData(formId) {
        var savedData = localStorage.getItem(formId);
        if (savedData) {
            var data = JSON.parse(savedData);
            var form = document.getElementById(formId);
            if (form) {
                Object.keys(data).forEach(function(key) {
                    var input = form.querySelector('[name="' + key + '"]');
                    if (input) {
                        input.value = data[key];
                    }
                });
            }
        }
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + N for new savings entry
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            window.location.href = '/add_savings';
        }
        
        // Escape to go back to home
        if (e.key === 'Escape') {
            window.location.href = '/';
        }
    });

    // Theme toggle (for future dark mode)
    function toggleTheme() {
        document.body.classList.toggle('dark-theme');
        localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
    }

    // Load saved theme
    var savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }

    // Add print styles
    function printFriendly() {
        window.print();
    }

    // Export functions to global scope
    window.FinSave = {
        saveFormData: saveFormData,
        loadFormData: loadFormData,
        toggleTheme: toggleTheme,
        printFriendly: printFriendly,
        animateNumber: animateNumber
    };
});