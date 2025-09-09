from flask import Flask, render_template, request, redirect, url_for, flash, session
import os
from datetime import datetime

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# Simple in-memory storage for demo purposes
savings_data = []

@app.route('/')
def index():
    """Home page showing the savings dashboard"""
    total_savings = sum(entry['amount'] for entry in savings_data)
    return render_template('index.html', 
                         savings_data=savings_data, 
                         total_savings=total_savings)

@app.route('/add_savings', methods=['GET', 'POST'])
def add_savings():
    """Add a new savings entry"""
    if request.method == 'POST':
        try:
            amount = float(request.form['amount'])
            description = request.form['description']
            category = request.form['category']
            
            savings_entry = {
                'id': len(savings_data) + 1,
                'amount': amount,
                'description': description,
                'category': category,
                'date': datetime.now().strftime('%Y-%m-%d %H:%M')
            }
            
            savings_data.append(savings_entry)
            flash(f'¡Ahorro de ${amount:.2f} agregado exitosamente!', 'success')
            return redirect(url_for('index'))
            
        except ValueError:
            flash('Por favor ingresa un monto válido', 'error')
    
    return render_template('add_savings.html')

@app.route('/learn')
def learn():
    """Educational content about financial savings"""
    tips = [
        {
            'title': 'Regla del 50/30/20',
            'description': 'Destina 50% a necesidades, 30% a deseos y 20% a ahorros'
        },
        {
            'title': 'Automatiza tus ahorros',
            'description': 'Configura transferencias automáticas a tu cuenta de ahorros'
        },
        {
            'title': 'Elimina gastos innecesarios',
            'description': 'Revisa tus suscripciones y elimina las que no uses'
        },
        {
            'title': 'Compara precios',
            'description': 'Antes de comprar algo, compara precios en diferentes lugares'
        }
    ]
    return render_template('learn.html', tips=tips)

@app.route('/goals')
def goals():
    """Savings goals and progress tracking"""
    sample_goals = [
        {'name': 'Fondo de emergencia', 'target': 1000, 'current': 250, 'progress': 25},
        {'name': 'Vacaciones', 'target': 2000, 'current': 800, 'progress': 40},
        {'name': 'Auto nuevo', 'target': 15000, 'current': 3000, 'progress': 20}
    ]
    return render_template('goals.html', goals=sample_goals)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)