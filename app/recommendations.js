// Lógica para generar recomendaciones de ahorro personalizadas
function extractCategory(descripcion) {
    if (!descripcion) return 'otros';
    const s = descripcion.toLowerCase();

    const mapping = {
        comida: ['comida', 'supermercado', 'restaurante', 'cafe', 'bar', 'uber', 'deliveroo', 'glovo'],
        ocio: ['ocio', 'cine', 'concierto'],
        alquiler: ['alquiler', 'renta', 'hipoteca'],
        transporte: ['gasolina', 'taxi', 'metro', 'bus', 'transporte', 'combustible'],
        suscripciones: ['spotify', 'netflix', 'prime', 'disney', 'subscription', 'suscrip', 'suscripción', 'suscripcion'],
        salud: ['farmacia', 'medico', 'clínica', 'salud'],
        compras: ['compra', 'tienda', 'amazon', 'ropa'],
        otros: []
    };

    for (const [cat, keys] of Object.entries(mapping)) {
        for (const k of keys) {
            if (k && s.includes(k)) return cat;
        }
    }

    // fallback: primera palabra
    const match = descripcion.trim().match(/[\p{L}\p{N}]+/u);
    return (match && match[0]) ? match[0].toLowerCase() : 'otros';
}

function generateRecommendations(movimientos = []) {
    // movimientos: array con { tipo, monto, descripcion, fecha }
    const ingresos = movimientos.filter(m => (m.tipo||'').toLowerCase() === 'ingreso');
    const gastos = movimientos.filter(m => (m.tipo||'').toLowerCase() === 'gasto');

    const totalIngresos = ingresos.reduce((s, m) => s + Math.abs(Number(m.monto) || 0), 0);
    const totalGastos = gastos.reduce((s, m) => s + Math.abs(Number(m.monto) || 0), 0);

    // Si no hay movimientos suficientes, consejos prácticos genéricos
    if (movimientos.length === 0) {
        return [
            'Registra al menos 2-4 semanas de movimientos reales para recomendaciones precisas.',
            'Empieza automatizando 10% de cada ingreso a una cuenta de ahorro separada.',
            'Revisa y anota tus 3 mayores gastos mensuales; ahí suele estar la mayor oportunidad.',
            'Haz una semana de «no gastar» cada mes para identificar gastos por impulso.',
            'Lista tus suscripciones y decide cuáles no usas en 30 días.'
        ];
    }

    // Calcular periodo observado (en días) para extrapolar a mensual
    const dates = movimientos.map(m => new Date(m.fecha || m.date || Date.now()).getTime());
    const minD = Math.min(...dates);
    const maxD = Math.max(...dates);
    const daysSpan = Math.max(7, Math.ceil((maxD - minD) / (24*3600*1000)));
    const monthsFactor = daysSpan / 30;

    // Agrupar por categoría semántica
    const byCat = {};
    gastos.forEach(g => {
        const cat = extractCategory(g.descripcion || 'otros');
        byCat[cat] = (byCat[cat] || 0) + Math.abs(Number(g.monto) || 0);
    });

    // Promedio mensual por categoría
    const monthlyByCat = {};
    Object.entries(byCat).forEach(([cat, total]) => {
        monthlyByCat[cat] = total / Math.max(0.1, monthsFactor);
    });

    // Detectar suscripciones: mismo texto o keyword y montos repetidos mensualmente
    const subs = {};
    gastos.forEach(g => {
        const desc = (g.descripcion || '').toLowerCase();
        if (/suscrip|subscr|spotify|netflix|prime|disney|subscription|suscripción|suscripcion/i.test(desc)) {
            const key = desc.replace(/[^a-z0-9]/g, '').slice(0,20) || desc;
            subs[key] = subs[key] || { desc: g.descripcion, total: 0, count: 0 };
            subs[key].total += Math.abs(Number(g.monto) || 0);
            subs[key].count += 1;
        }
    });

    // Micropagos frecuentes
    const micropagos = gastos.filter(g => Math.abs(Number(g.monto) || 0) < 5);

    // Construir recomendaciones concretas
    const recs = [];

    // 1) Priorizar por mayor peso mensual
    const catEntries = Object.entries(monthlyByCat).sort((a,b) => b[1]-a[1]);
    if (catEntries.length > 0) {
        const [topCat, topAmount] = catEntries[0];
        // si pesa significativamente (>=6% del gasto mensual)
        const monthlyTotal = totalGastos / Math.max(0.1, monthsFactor);
        const pct = Math.round((topAmount / Math.max(1, monthlyTotal)) * 100);
        if (pct >= 6) {
            const targetReducePct = pct >= 15 ? 0.15 : 0.10; // más agresivo si pesa mucho
            const newMonthly = Math.max(0, topAmount * (1 - targetReducePct));
            const weeklyTarget = +(newMonthly / 4).toFixed(2);
            const estimatedSave = +(topAmount * targetReducePct).toFixed(2);
            recs.push(`Reduce gastos en ${topCat}: actualmente ~€${topAmount.toFixed(2)}/mes (${pct}%). Prueba un presupuesto de €${weeklyTarget}/semana para esa categoría — ahorro estimado €${estimatedSave}/mes si reduces ${Math.round(targetReducePct*100)}%.`);
        }
    }

    // 2) Suscripciones detectadas
    const subsList = Object.values(subs);
    if (subsList.length > 0) {
        const lines = subsList.map(s => `${s.desc} (€${(s.total / Math.max(1, s.count)).toFixed(2)})`).slice(0,3);
        recs.push(`Revisa estas suscripciones: ${lines.join(', ')}. Considera pausar o cambiar el plan; ahorrarás hasta €${subsList.reduce((s,v)=>s+v.total,0).toFixed(2)}/mes si cancelas las menos usadas.`);
    }

    // 3) Micropagos frecuentes
    if (micropagos.length >= 6) {
        const count = micropagos.length;
        recs.push(`He detectado ${count} micropagos (<€5). Control semanal: limita a 3 micropagos/semana y ahorra aproximadamente €${(micropagos.reduce((s,m)=>s+Math.abs(Number(m.monto)||0),0)/Math.max(1,monthsFactor)).toFixed(2)}/mes.`);
    }

    // 4) Automatizar ahorro + objetivo
    if (totalIngresos > 0) {
        const suggested = Math.max( Math.round((totalIngresos/Math.max(0.1, monthsFactor)) * 0.1 * 100) / 100, 5 );
        recs.push(`Automatiza al menos €${suggested}/mes hacia ahorro (regla simple: 10% de ingresos). Usa transferencias programadas justo al recibir el sueldo.`);
    } else {
        recs.push('Si no registras ingresos, empieza por anotar entradas de dinero para calcular cuánto puedes ahorrar.');
    }

    // 5) Fondo de emergencia
    const avgMonthlyGastos = (totalGastos / Math.max(0.1, monthsFactor));
    if (avgMonthlyGastos > 0) {
        recs.push(`Fondo de emergencia: apunta a 3 meses ≈ €${(avgMonthlyGastos*3).toFixed(0)} — empieza con aportes pequeños regulares.`);
    }

    // Devolver sólo hasta 5 recomendaciones únicas y prácticas
    const uniq = Array.from(new Set(recs)).slice(0,5);
    return uniq;
}

module.exports = { generateRecommendations };


