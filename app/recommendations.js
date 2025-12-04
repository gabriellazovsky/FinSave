function translateTemplate(key, params = {}) {
    let text = translations[currentLang][key] || key;
    for (const [k,v] of Object.entries(params)) {
        text = text.replace(new RegExp(`{${k}}`, 'g'), v);
    }
    return text;
}

// Función principal adaptada
function generateRecommendations(movimientos = []) {
    const ingresos = movimientos.filter(m => (m.tipo||'').toLowerCase() === 'ingreso');
    const gastos = movimientos.filter(m => (m.tipo||'').toLowerCase() === 'gasto');

    const totalIngresos = ingresos.reduce((s, m) => s + Math.abs(Number(m.monto) || 0), 0);
    const totalGastos = gastos.reduce((s, m) => s + Math.abs(Number(m.monto) || 0), 0);

    if (movimientos.length === 0) {
        return [
            translateTemplate("recommendations.recordMovements"),
            translateTemplate("recommendations.automateSavings", { pct: 10 }),
            translateTemplate("recommendations.reviewTopExpenses"),
            translateTemplate("recommendations.noSpendWeek"),
            translateTemplate("recommendations.listSubscriptions")
        ];
    }

    const dates = movimientos.map(m => new Date(m.fecha || m.date || Date.now()).getTime());
    const minD = Math.min(...dates);
    const maxD = Math.max(...dates);
    const daysSpan = Math.max(7, Math.ceil((maxD - minD) / (24*3600*1000)));
    const monthsFactor = daysSpan / 30;

    const byCat = {};
    gastos.forEach(g => {
        const cat = extractCategory(g.descripcion || 'otros');
        byCat[cat] = (byCat[cat] || 0) + Math.abs(Number(g.monto) || 0);
    });

    const monthlyByCat = {};
    Object.entries(byCat).forEach(([cat, total]) => {
        monthlyByCat[cat] = total / Math.max(0.1, monthsFactor);
    });

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
            recs.push(translateTemplate("recommendations.reduceCategory", {
                category: topCat,
                amount: `€${topAmount.toFixed(2)}`,
                pct,
                weeklyTarget: `€${weeklyTarget}`,
                estimatedSave: `€${estimatedSave}`
            }));
        }
    }

    const subsList = Object.values(subs);
    if (subsList.length > 0) {
        const lines = subsList.map(s => `${s.desc} (€${(s.total / Math.max(1, s.count)).toFixed(2)})`).slice(0,3);
        recs.push(translateTemplate("recommendations.checkSubscriptions", {
            subs: lines.join(', '),
            total: `€${subsList.reduce((s,v)=>s+v.total,0).toFixed(2)}`
        }));
    }

    if (micropagos.length >= 6) {
        recs.push(translateTemplate("recommendations.micropayments", {
            count: micropagos.length,
            maxAmount: '€5',
            monthlySave: `€${(micropagos.reduce((s,m)=>s+Math.abs(Number(m.monto)||0),0)/Math.max(1,monthsFactor)).toFixed(2)}`
        }));
    }

    if (totalIngresos > 0) {
        const suggested = Math.max( Math.round((totalIngresos/Math.max(0.1, monthsFactor)) * 0.1 * 100) / 100, 5 );
        recs.push(translateTemplate("recommendations.suggestedSaving", { suggested: `€${suggested}` }));
    } else {
        recs.push(translateTemplate("recommendations.noIncome"));
    }

    const avgMonthlyGastos = (totalGastos / Math.max(0.1, monthsFactor));
    if (avgMonthlyGastos > 0) {
        recs.push(translateTemplate("recommendations.emergencyFund", { amount: `€${(avgMonthlyGastos*3).toFixed(0)}` }));
    }

    return Array.from(new Set(recs)).slice(0,5);
}
