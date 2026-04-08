/**
 * Módulo para gerenciamento de gráficos utilizando Chart.js.
 */

// Armazena as instâncias dos gráficos para permitir destruição e recriação
let chartInstances = { bar: null, doughnut: null, pareto: null, trend: null };

/**
 * Renderiza todos os gráficos baseando-se nos dados filtrados.
 * @param {number} topN Quantidade de itens a serem exibidos nos rankings.
 * @param {Array} filteredData Dados filtrados pelo usuário.
 * @param {Array} rawData Dados brutos carregados (usado para tendência).
 * @param {string[]} selectedOrigins Lista de origens selecionadas nos filtros.
 */
export function renderCharts(topN, filteredData, rawData, selectedOrigins) {
    let itemCounts = {};
    let itemDefects = {};
    filteredData.forEach(d => {
        let key = d.peca;
        itemCounts[key] = (itemCounts[key] || 0) + d.quantidade;
        if (!itemDefects[key]) itemDefects[key] = {};
        itemDefects[key][d.defeito] = (itemDefects[key][d.defeito] || 0) + d.quantidade;
    });

    let sortedItems = Object.keys(itemCounts).map(k => ({ name: k, qty: itemCounts[k] }))
        .sort((a, b) => b.qty - a.qty).slice(0, topN);

    const barTooltips = sortedItems.map(i => {
        let defects = itemDefects[i.name];
        let sortedDef = Object.keys(defects).sort((a, b) => defects[b] - defects[a]).slice(0, 5);
        return sortedDef.map(d => `${d} (${defects[d]})`);
    });

    const barLabels = sortedItems.map(i => i.name.length > 15 ? i.name.substring(0, 15) + '...' : i.name);
    const barData = sortedItems.map(i => i.qty);

    let originCounts = {};
    filteredData.forEach(d => {
        originCounts[d.origem] = (originCounts[d.origem] || 0) + d.quantidade;
    });

    // 1. Gráfico de Barras (Ranking de Peças)
    if (chartInstances.bar) chartInstances.bar.destroy();
    const ctxBar = document.getElementById('barChart').getContext('2d');
    chartInstances.bar = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: barLabels,
            datasets: [{
                label: 'Quantidade de Defeitos',
                data: barData,
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        afterLabel: function (context) {
                            let lines = barTooltips[context.dataIndex];
                            return lines && lines.length ? ['Defeitos:'].concat(lines.map(l => '• ' + l)) : null;
                        }
                    }
                }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });

    // 2. Gráfico de Rosca (Origem)
    if (chartInstances.doughnut) chartInstances.doughnut.destroy();
    const ctxDoughnut = document.getElementById('doughnutChart').getContext('2d');
    chartInstances.doughnut = new Chart(ctxDoughnut, {
        type: 'doughnut',
        data: {
            labels: Object.keys(originCounts),
            datasets: [{
                data: Object.values(originCounts),
                backgroundColor: ['#00D15B', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7'],
                borderWidth: 1,
                borderColor: '#171717',
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#e2e8f0', padding: 20 } }
            },
            cutout: '70%'
        }
    });

    // 3. Gráfico de Pareto (Defeitos)
    let defectCountsRaw = {};
    let defectParts = {};
    filteredData.forEach(d => {
        let key = d.defeito;
        defectCountsRaw[key] = (defectCountsRaw[key] || 0) + d.quantidade;
        if (!defectParts[key]) defectParts[key] = {};
        defectParts[key][d.peca] = (defectParts[key][d.peca] || 0) + d.quantidade;
    });

    let sortedDefectsAll = Object.keys(defectCountsRaw).map(k => ({ name: k, qty: defectCountsRaw[k] })).sort((a, b) => b.qty - a.qty);
    let sortedDefects = sortedDefectsAll.slice(0, topN);

    const paretoTooltips = sortedDefects.map(i => {
        let parts = defectParts[i.name];
        let sortedParts = Object.keys(parts).sort((a, b) => parts[b] - parts[a]).slice(0, 5);
        return sortedParts.map(p => {
            let partName = p.length > 25 ? p.substring(0, 25) + '...' : p;
            return `${partName} (${parts[p]})`;
        });
    });

    const paretoLabels = sortedDefects.map(i => i.name.length > 20 ? i.name.substring(0, 20) + '...' : i.name);
    const paretoData = sortedDefects.map(i => i.qty);

    if (chartInstances.pareto) chartInstances.pareto.destroy();
    const ctxPareto = document.getElementById('paretoChart').getContext('2d');
    chartInstances.pareto = new Chart(ctxPareto, {
        type: 'bar',
        data: {
            labels: paretoLabels,
            datasets: [{
                label: 'Total por Defeito',
                data: paretoData,
                backgroundColor: 'rgba(234, 88, 12, 0.8)',
                borderColor: 'rgb(234, 88, 12)',
                borderWidth: 1,
                borderRadius: 4,
                yAxisID: 'y'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'top', labels: { color: '#e2e8f0' } },
                tooltip: {
                    callbacks: {
                        afterLabel: function (context) {
                            let lines = paretoTooltips[context.dataIndex];
                            return lines && lines.length ? ['Peças:'].concat(lines.map(l => '• ' + l)) : null;
                        }
                    }
                }
            },
            scales: {
                y: { beginAtZero: true, position: 'left', title: { display: false }, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });

    // 4. Gráfico de Tendência (Série Temporal)
    let trendDataPoints = rawData.filter(d => selectedOrigins.includes(d.origem));
    let trendCounts = {};
    trendDataPoints.forEach(d => {
        let key = d.mes;
        trendCounts[key] = (trendCounts[key] || 0) + d.quantidade;
    });

    const monthOrder = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
    let sortedMonths = Object.keys(trendCounts).sort((a, b) => {
        let indexA = monthOrder.findIndex(m => a.toUpperCase().includes(m));
        let indexB = monthOrder.findIndex(m => b.toUpperCase().includes(m));
        if (indexA === -1) indexA = 99;
        if (indexB === -1) indexB = 99;
        return indexA - indexB;
    });

    const trendLabels = sortedMonths;
    const trendDataValues = sortedMonths.map(m => trendCounts[m]);

    if (chartInstances.trend) chartInstances.trend.destroy();
    const ctxTrend = document.getElementById('trendChart').getContext('2d');
    chartInstances.trend = new Chart(ctxTrend, {
        type: 'line',
        data: {
            labels: trendLabels,
            datasets: [{
                label: 'Evolução Total',
                data: trendDataValues,
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                borderWidth: 3,
                pointBackgroundColor: '#22c55e',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#22c55e',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });
}
