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


function generateRecommendations(movimientos = [], lang = 'es') {
    // movimientos: array con { tipo, monto, descripcion, fecha }
    const ingresos = movimientos.filter(m => (m.tipo||'').toLowerCase() === 'ingreso');
    const gastos = movimientos.filter(m => (m.tipo||'').toLowerCase() === 'gasto');

    const totalIngresos = ingresos.reduce((s, m) => s + Math.abs(Number(m.monto) || 0), 0);
    const totalGastos = gastos.reduce((s, m) => s + Math.abs(Number(m.monto) || 0), 0);

    // Si no hay movimientos suficientes, consejos genéricos
    if (movimientos.length === 0) {
        return [
            { key: 'advice.recordMore', params: {} },
            { key: 'advice.automateSavings', params: {} },
            { key: 'advice.reviewTopExpenses', params: {} },
            { key: 'advice.noSpendWeek', params: {} },
            { key: 'advice.checkSubscriptions', params: {} }
        ];
    }

    const dates = movimientos.map(m => new Date(m.fecha || m.date || Date.now()).getTime());
    const minD = Math.min(...dates);
    const maxD = Math.max(...dates);
    const daysSpan = Math.max(7, Math.ceil((maxD - minD) / (24*3600*1000)));
    const monthsFactor = daysSpan / 30;

    // Agrupar por categoría
    const byCat = {};
    gastos.forEach(g => {
        const cat = extractCategory(g.descripcion || 'otros');
        byCat[cat] = (byCat[cat] || 0) + Math.abs(Number(g.monto) || 0);
    });

    const monthlyByCat = {};
    Object.entries(byCat).forEach(([cat, total]) => {
        monthlyByCat[cat] = total / Math.max(0.1, monthsFactor);
    });

    // Detectar suscripciones
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

    const micropagos = gastos.filter(g => Math.abs(Number(g.monto) || 0) < 5);

    const recs = [];

    // 1) Mayor categoría mensual
    const catEntries = Object.entries(monthlyByCat).sort((a,b) => b[1]-a[1]);
    if (catEntries.length > 0) {
        const [topCat, topAmount] = catEntries[0];
        const monthlyTotal = totalGastos / Math.max(0.1, monthsFactor);
        const pct = Math.round((topAmount / Math.max(1, monthlyTotal)) * 100);
        if (pct >= 6) {
            const targetReducePct = pct >= 15 ? 0.15 : 0.10;
            const newMonthly = Math.max(0, topAmount * (1 - targetReducePct));
            const weeklyTarget = +(newMonthly / 4).toFixed(2);
            const estimatedSave = +(topAmount * targetReducePct).toFixed(2);

            recs.push({
                key: 'advice.reduceCategory',
                params: {
                    category: topCat,
                    topAmount: topAmount.toFixed(2),
                    pct,
                    weeklyTarget,
                    estimatedSave,
                    reducePct: Math.round(targetReducePct*100)
                }
            });
        }
    }

    // 2) Suscripciones
    const subsList = Object.values(subs);
    if (subsList.length > 0) {
        recs.push({
            key: 'advice.reviewSubscriptions',
            params: {
                subs: subsList.map(s => `${s.desc} (€${(s.total / Math.max(1, s.count)).toFixed(2)})`).slice(0,3).join(', '),
                total: subsList.reduce((s,v)=>s+v.total,0).toFixed(2)
            }
        });
    }

    // 3) Micropagos frecuentes
    if (micropagos.length >= 6) {
        const count = micropagos.length;
        const saveEstimate = (micropagos.reduce((s,m)=>s+Math.abs(Number(m.monto)||0),0)/Math.max(1,monthsFactor)).toFixed(2);
        recs.push({ key: 'advice.controlMicropagos', params: { count, saveEstimate } });
    }

    // 4) Automatizar ahorro
    if (totalIngresos > 0) {
        const suggested = Math.max(Math.round((totalIngresos/Math.max(0.1, monthsFactor)) * 0.1 * 100)/100, 5);
        recs.push({ key: 'advice.automateSavingsAmount', params: { suggested } });
    }

    // 5) Fondo de emergencia
    const avgMonthlyGastos = totalGastos / Math.max(0.1, monthsFactor);
    if (avgMonthlyGastos > 0) {
        recs.push({ key: 'advice.emergencyFund', params: { fund: (avgMonthlyGastos*3).toFixed(0) } });
    }

    return recs.slice(0,5);
}
