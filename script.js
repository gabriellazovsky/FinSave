// Mobile navigation toggle
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    navToggle.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        
        // Animate hamburger menu
        const spans = navToggle.querySelectorAll('span');
        spans.forEach((span, index) => {
            if (navMenu.classList.contains('active')) {
                if (index === 0) span.style.transform = 'rotate(45deg) translate(5px, 5px)';
                if (index === 1) span.style.opacity = '0';
                if (index === 2) span.style.transform = 'rotate(-45deg) translate(7px, -6px)';
            } else {
                span.style.transform = 'none';
                span.style.opacity = '1';
            }
        });
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            const spans = navToggle.querySelectorAll('span');
            spans.forEach(span => {
                span.style.transform = 'none';
                span.style.opacity = '1';
            });
        });
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add goal functionality
    const addGoalBtn = document.querySelector('.add-goal-btn');
    if (addGoalBtn) {
        addGoalBtn.addEventListener('click', addNewGoal);
    }

    // Initialize tooltips and other interactive elements
    initializeInteractiveElements();
});

// Savings calculator function
function calculateSavings() {
    const amount = parseFloat(document.getElementById('amount').value) || 0;
    const monthly = parseFloat(document.getElementById('monthly').value) || 0;
    const interest = parseFloat(document.getElementById('interest').value) || 0;
    
    const resultsDiv = document.getElementById('results');
    
    if (amount <= 0 || monthly <= 0) {
        resultsDiv.innerHTML = '<p style="color: #ef4444;">Por favor, ingresa valores válidos para la cantidad y el ahorro mensual.</p>';
        return;
    }
    
    // Calculate time to reach goal without interest
    const monthsSimple = Math.ceil(amount / monthly);
    
    // Calculate with compound interest
    const monthlyRate = interest / 100 / 12;
    let monthsWithInterest = 0;
    let currentAmount = 0;
    
    if (interest > 0) {
        while (currentAmount < amount && monthsWithInterest < 1000) { // Prevent infinite loop
            currentAmount = currentAmount * (1 + monthlyRate) + monthly;
            monthsWithInterest++;
        }
    } else {
        monthsWithInterest = monthsSimple;
    }
    
    const yearsSimple = Math.floor(monthsSimple / 12);
    const remainingMonthsSimple = monthsSimple % 12;
    
    const yearsWithInterest = Math.floor(monthsWithInterest / 12);
    const remainingMonthsWithInterest = monthsWithInterest % 12;
    
    const totalContributed = monthly * monthsWithInterest;
    const interestEarned = interest > 0 ? amount - totalContributed : 0;
    
    const formatTime = (years, months) => {
        if (years === 0) return `${months} mes${months !== 1 ? 'es' : ''}`;
        if (months === 0) return `${years} año${years !== 1 ? 's' : ''}`;
        return `${years} año${years !== 1 ? 's' : ''} y ${months} mes${months !== 1 ? 'es' : ''}`;
    };
    
    resultsDiv.innerHTML = `
        <div class="result-item">
            <h4>⏰ Tiempo para alcanzar la meta:</h4>
            <p><strong>${formatTime(yearsWithInterest, remainingMonthsWithInterest)}</strong></p>
        </div>
        <div class="result-item">
            <h4>💰 Total a contribuir:</h4>
            <p><strong>$${totalContributed.toLocaleString()}</strong></p>
        </div>
        ${interest > 0 ? `
        <div class="result-item">
            <h4>📈 Interés ganado:</h4>
            <p><strong>$${interestEarned.toLocaleString()}</strong></p>
        </div>
        <div class="result-item">
            <h4>🎯 Meta final:</h4>
            <p><strong>$${amount.toLocaleString()}</strong></p>
        </div>
        ` : ''}
        <div class="savings-tip">
            <h4>💡 Tip:</h4>
            <p>${getSavingsTip(monthsWithInterest, interest)}</p>
        </div>
    `;
}

// Generate savings tips based on calculation results
function getSavingsTip(months, interest) {
    const tips = [
        "Considera automatizar tus ahorros para no olvidar hacer depósitos mensuales.",
        "Revisa tu presupuesto mensualmente para encontrar oportunidades de ahorrar más.",
        "Celebra los pequeños logros en el camino hacia tu meta principal.",
        "Mantén tu dinero en una cuenta separada para evitar gastarlo accidentalmente."
    ];
    
    if (months > 60) {
        return "Tu meta tomará más de 5 años. Considera aumentar tu ahorro mensual o buscar inversiones con mayor rendimiento.";
    } else if (months > 24) {
        return "Es una meta a largo plazo. Mantén la disciplina y considera revisar tu progreso cada 6 meses.";
    } else if (interest === 0) {
        return "Considera depositar tus ahorros en una cuenta que genere intereses para alcanzar tu meta más rápido.";
    } else {
        return tips[Math.floor(Math.random() * tips.length)];
    }
}

// Add new savings goal
function addNewGoal() {
    const goalName = prompt("¿Cuál es tu nueva meta de ahorro?");
    const goalAmount = prompt("¿Cuánto dinero quieres ahorrar?");
    
    if (goalName && goalAmount && !isNaN(goalAmount) && parseFloat(goalAmount) > 0) {
        const savingsGrid = document.querySelector('.savings-grid');
        const addGoalCard = document.querySelector('.add-goal-card');
        
        const newGoalCard = document.createElement('div');
        newGoalCard.className = 'savings-card';
        newGoalCard.innerHTML = `
            <h3>${goalName}</h3>
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
                <span class="progress-text">$0 / $${parseFloat(goalAmount).toLocaleString()}</span>
            </div>
            <p class="savings-description">Meta recién creada</p>
            <button class="add-money-btn" onclick="addMoney(this)" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #10b981; color: white; border: none; border-radius: 0.5rem; cursor: pointer;">
                Agregar dinero
            </button>
        `;
        
        // Insert before the add goal card
        savingsGrid.insertBefore(newGoalCard, addGoalCard);
        
        // Add animation
        newGoalCard.style.opacity = '0';
        newGoalCard.style.transform = 'translateY(20px)';
        setTimeout(() => {
            newGoalCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            newGoalCard.style.opacity = '1';
            newGoalCard.style.transform = 'translateY(0)';
        }, 100);
    } else if (goalName || goalAmount) {
        alert("Por favor, ingresa un nombre válido y una cantidad numérica para tu meta.");
    }
}

// Add money to a savings goal
function addMoney(button) {
    const amount = prompt("¿Cuánto dinero quieres agregar?");
    if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
        const card = button.closest('.savings-card');
        const progressText = card.querySelector('.progress-text');
        const progressFill = card.querySelector('.progress-fill');
        
        // Parse current progress
        const currentText = progressText.textContent;
        const matches = currentText.match(/\$([0-9,]+) \/ \$([0-9,]+)/);
        
        if (matches) {
            const current = parseFloat(matches[1].replace(/,/g, ''));
            const target = parseFloat(matches[2].replace(/,/g, ''));
            const newAmount = current + parseFloat(amount);
            const percentage = Math.min((newAmount / target) * 100, 100);
            
            // Update progress
            progressText.textContent = `$${newAmount.toLocaleString()} / $${target.toLocaleString()}`;
            progressFill.style.width = `${percentage}%`;
            
            // Show celebration if goal reached
            if (newAmount >= target) {
                setTimeout(() => {
                    alert(`¡Felicitaciones! Has alcanzado tu meta de ${card.querySelector('h3').textContent}! 🎉`);
                }, 300);
            }
        }
    } else if (amount) {
        alert("Por favor, ingresa una cantidad válida.");
    }
}

// Initialize interactive elements
function initializeInteractiveElements() {
    // Add money buttons for existing goals
    document.querySelectorAll('.savings-card').forEach(card => {
        if (!card.querySelector('.add-money-btn') && !card.classList.contains('add-goal-card')) {
            const button = document.createElement('button');
            button.className = 'add-money-btn';
            button.textContent = 'Agregar dinero';
            button.style.cssText = 'margin-top: 1rem; padding: 0.5rem 1rem; background: #10b981; color: white; border: none; border-radius: 0.5rem; cursor: pointer;';
            button.onclick = function() { addMoney(this); };
            card.appendChild(button);
        }
    });

    // Add hover effects to education cards
    document.querySelectorAll('.education-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(-4px) scale(1)';
        });
    });

    // Add click handlers for education buttons
    document.querySelectorAll('.learn-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const card = this.closest('.education-card');
            const title = card.querySelector('h3').textContent;
            showEducationalContent(title);
        });
    });

    // Add form validation
    const calculatorInputs = document.querySelectorAll('#amount, #monthly, #interest');
    calculatorInputs.forEach(input => {
        input.addEventListener('input', function() {
            if (this.value < 0) this.value = 0;
        });
        
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                calculateSavings();
            }
        });
    });
}

// Show educational content (placeholder for future expansion)
function showEducationalContent(topic) {
    const content = {
        'Conceptos Básicos': 'Los fundamentos del ahorro incluyen: crear un presupuesto, distinguir entre necesidades y deseos, y establecer metas claras.',
        'Tips de Ahorro': 'Algunos tips efectivos: paga tus deudas primero, automatiza tus ahorros, aprovecha descuentos y ofertas, y revisa tus gastos regularmente.',
        'Metas SMART': 'Las metas SMART son: Específicas, Medibles, Alcanzables, Relevantes y con Tiempo definido. Ejemplo: "Ahorrar $1,000 en 10 meses para vacaciones".'
    };
    
    alert(`${topic}:\n\n${content[topic] || 'Contenido próximamente disponible.'}`);
}

// Add CSS for result items
const style = document.createElement('style');
style.textContent = `
    .result-item {
        margin-bottom: 1rem;
        padding: 0.75rem;
        background-color: #f8fafc;
        border-radius: 0.5rem;
        border-left: 4px solid var(--primary-color);
    }
    
    .result-item h4 {
        margin-bottom: 0.25rem;
        font-size: 0.9rem;
        color: var(--text-secondary);
    }
    
    .result-item p {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text-primary);
    }
    
    .savings-tip {
        margin-top: 1.5rem;
        padding: 1rem;
        background-color: #ecfdf5;
        border-radius: 0.5rem;
        border: 1px solid #10b981;
    }
    
    .savings-tip h4 {
        margin-bottom: 0.5rem;
        color: #059669;
    }
    
    .savings-tip p {
        color: #047857;
        font-size: 0.9rem;
    }
    
    .add-money-btn:hover {
        background-color: #059669 !important;
        transform: translateY(-1px);
    }
`;
document.head.appendChild(style);