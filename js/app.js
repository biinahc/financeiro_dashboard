let rawData = [];
let filteredData = [];
let ignoredCodes = new Set();
let isImportadosFile = false;
let charts = { bar: null, doughnut: null, pareto: null, trend: null };
const colAliases = {
    peca: ['peça', 'nome', 'produto', 'item', 'descrição da peça', 'descricao da peca', 'part', 'material não conforme', 'material nao conforme'],
    quantidade: ['quantidade', 'qtd', 'qtde', 'total', 'qt total', 'qtd total', 'qntd', 'qtd total'],
    defeito: ['problema', 'defeito', 'falha', 'motivo', 'nqm', 'não conformidade', 'descrição defeito', 'descricao defeito'],
    origem: ['origem', 'fornecedor', 'processo', 'causa'],
    codigo: ['código', 'codigo', 'cod', 'pn', 'part number', 'cód'],
    mes: ['mês', 'mes', 'data', 'periodo', 'período'],
    retornou: ['retornou', 'descartadas', 'descarte', 'retorno'],
    rsUnitario: ['r$ unitário', 'unitário', 'valor unitario', 'r$ unitario'],
    rsGeral: ['r$ geral', 'geral', 'valor total', 'valor geral', 'r$ geral']
};
const fileUpload = document.getElementById('fileUpload');
const monthFilter = document.getElementById('monthFilter');
const topNSlider = document.getElementById('topNSlider');
const originFiltersContainer = document.getElementById('originFiltersContainer');
const searchTable = document.getElementById('searchTable');
const ignoredItemsContainerWrapper = document.getElementById('ignoredItemsContainerWrapper');
const ignoredItemsContainer = document.getElementById('ignoredItemsContainer');
const btnExportPDF = document.getElementById('btnExportPDF');
const spreadsheetTitleContainer = document.getElementById('spreadsheetTitleContainer');
const spreadsheetTitle = document.getElementById('spreadsheetTitle');
const kpiTotalLabel = document.getElementById('kpiTotalLabel');
fileUpload.addEventListener('change', handleFileUpload);
monthFilter.addEventListener('change', applyFilters);
topNSlider.addEventListener('input', (e) => {
    topNValue.textContent = e.target.value;
    applyFilters();
});
searchTable.addEventListener('input', renderTable);
btnExportPDF.addEventListener('click', generatePDF);
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = "'Inter', sans-serif";
function normalizeHeader(header) {
    return header.toString().toLowerCase().trim().replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');
}
function findColumnKey(headers, aliasList) {
    for (let header of headers) {
        let norm = normalizeHeader(header);
        if (aliasList.some(alias => norm.includes(alias))) return header;
    }
    return null;
}
function processRowData(row, colMap) {
    let qty = row[colMap.quantidade];
    if (typeof qty === 'string') qty = parseInt(qty.replace(/\D/g, '')) || 0;
    let origem = (row[colMap.origem] || 'Não Informado').toString().trim();
    if (origem.toLowerCase() === 'forn') origem = 'Fornecedor';
    else if (origem.toLowerCase() === 'proc') origem = 'Processo';
    let mesStr = 'Geral';
    if (colMap.mes && row[colMap.mes]) {
        const rawMes = row[colMap.mes];
        if (typeof rawMes === 'number') {
            let date = new Date(Math.round((rawMes - 25569) * 86400 * 1000));
            mesStr = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        } else {
            mesStr = String(rawMes).trim();
        }
    }
    let ret = row[colMap.retornou];
    if (typeof ret === 'string') ret = parseInt(ret.replace(/\D/g, '')) || 0;
    return {
        codigo: row[colMap.codigo] || '-',
        peca: row[colMap.peca] || 'Desconhecida',
        defeito: row[colMap.defeito] || 'Não Especificado',
        quantidade: Number(qty) || 0,
        retornou: Number(ret) || 0,
        rsUnitario: Number(row[colMap.rsUnitario]) || 0,
        rsGeral: Number(row[colMap.rsGeral]) || 0,
        origem: origem,
        mes: mesStr
    };
}
async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    isImportadosFile = file.name.toLowerCase().includes('importado');
    const reader = new FileReader();
    reader.onload = function (evt) {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        rawData = [];
        const monthsSet = new Set();
        if (spreadsheetTitleContainer && spreadsheetTitle) {
            spreadsheetTitle.textContent = file.name;
            spreadsheetTitleContainer.classList.remove('hidden');
        }
        if (kpiTotalLabel) {
            kpiTotalLabel.textContent = isImportadosFile ? 'Total de Materiais Não Conforme' : 'Total Retrabalhado';
        }
        workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
            if (rawRows.length === 0) return;
            let headerRowIndex = -1;
            let bestColMap = null;
            let maxMatches = 0;
            for (let i = 0; i < Math.min(10, rawRows.length); i++) {
                const row = rawRows[i];
                if (!row || row.length === 0) continue;
                const colMap = {
                    peca: findColumnKey(row, colAliases.peca),
                    quantidade: findColumnKey(row, colAliases.quantidade),
                    defeito: findColumnKey(row, colAliases.defeito),
                    origem: findColumnKey(row, colAliases.origem),
                    codigo: findColumnKey(row, colAliases.codigo),
                    mes: findColumnKey(row, colAliases.mes),
                    retornou: findColumnKey(row, colAliases.retornou),
                    rsUnitario: findColumnKey(row, colAliases.rsUnitario),
                    rsGeral: findColumnKey(row, colAliases.rsGeral)
                };
                let matches = 0;
                if (colMap.peca) matches++;
                if (colMap.quantidade) matches++;
                if (colMap.defeito) matches++;
                if (colMap.origem) matches++;
                if (colMap.codigo) matches++;
                if (colMap.mes) matches++;
                if (matches > maxMatches) {
                    maxMatches = matches;
                    headerRowIndex = i;
                    bestColMap = colMap;
                }
            }
            if (maxMatches < 2 || !bestColMap.quantidade) {
                console.warn(`Aba "${sheetName}" ignorada por não encontrar colunas chave suficientes.`);
                return;
            }
            const headers = rawRows[headerRowIndex];
            for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
                const rowArr = rawRows[i];
                const rowObj = {};
                headers.forEach((h, idx) => {
                    if (h) rowObj[h] = rowArr[idx];
                });
                const values = Object.values(rowObj).join('').trim();
                if (!values) continue;
                let parsed = processRowData(rowObj, bestColMap);
                const descPeca = String(parsed.peca).toLowerCase();
                const descOrigem = String(parsed.origem).toLowerCase();
                const descDefeito = String(parsed.defeito).toLowerCase();
                const descCodigo = String(parsed.codigo).toLowerCase();
                if (descPeca.includes('total') || descPeca === 'soma' || descPeca === 'total geral' ||
                    descDefeito.includes('total') || descOrigem.includes('total') || descCodigo.includes('total') ||
                    descPeca.includes('desconhecida') || descCodigo.includes('clique') || descCodigo === '-') {
                    continue;
                }
                if (!bestColMap.mes || parsed.mes === 'Geral') {
                    const monthsRegex = /janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez/i;
                    if (monthsRegex.test(sheetName)) {
                        const monthMap = {
                            'jan': 'JANEIRO', 'fev': 'FEVEREIRO', 'mar': 'MARÇO', 'abr': 'ABRIL',
                            'mai': 'MAIO', 'jun': 'JUNHO', 'jul': 'JULHO', 'ago': 'AGOSTO',
                            'set': 'SETEMBRO', 'out': 'OUTUBRO', 'nov': 'NOVEMBRO', 'dez': 'DEZEMBRO'
                        };
                        let matchedName = sheetName.toLowerCase().trim();
                        if (monthMap[matchedName]) {
                            parsed.mes = monthMap[matchedName];
                        } else {
                            parsed.mes = sheetName.toUpperCase();
                        }
                    }
                }
                if (parsed.quantidade > 0) {
                    rawData.push(parsed);
                    monthsSet.add(parsed.mes);
                }
            }
        });
        updateMonthFilter(Array.from(monthsSet));
        updateOriginFilters();
        applyFilters();
        if (btnExportPDF) {
            btnExportPDF.classList.remove('hidden');
        }
    };
    reader.readAsBinaryString(file);
}
function updateOriginFilters() {
    const origins = new Set(rawData.map(d => d.origem));
    originFiltersContainer.innerHTML = '';
    if (origins.size === 0) {
        originFiltersContainer.innerHTML = '<span class="text-secondary text-sm">Nenhuma origem encontrada.</span>';
        return;
    }
    Array.from(origins).sort().forEach(origem => {
        const label = document.createElement('label');
        label.className = 'inline-flex items-center cursor-pointer mb-2 mr-4';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.value = origem;
        input.checked = true;
        input.className = 'origin-filter-checkbox form-checkbox text-primary h-5 w-5 rounded border-gray-600 bg-cardBg focus:ring-primary';
        input.addEventListener('change', applyFilters);
        const span = document.createElement('span');
        span.className = 'ml-2 text-gray-300 text-sm';
        span.textContent = origem;
        label.appendChild(input);
        label.appendChild(span);
        originFiltersContainer.appendChild(label);
    });
}
function getSelectedOrigins() {
    const checkboxes = document.querySelectorAll('.origin-filter-checkbox');
    const selected = [];
    checkboxes.forEach(cb => {
        if (cb.checked) selected.push(cb.value);
    });
    return selected;
}
function updateMonthFilter(months) {
    monthFilter.innerHTML = '<option value="ALL">Todos os Meses</option>';
    months.sort().forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m.charAt(0).toUpperCase() + m.slice(1);
        monthFilter.appendChild(opt);
    });
}
function applyFilters() {
    const selMonth = monthFilter.value;
    const topN = parseInt(topNSlider.value);
    const selectedOrigins = getSelectedOrigins();
    filteredData = rawData.filter(d => {
        const matchMonth = selMonth === 'ALL' || d.mes === selMonth;
        const matchOrigin = selectedOrigins.includes(d.origem);
        const isExcluded = ignoredCodes.has(`${d.codigo}:::${d.defeito}`);
        return matchMonth && matchOrigin && !isExcluded;
    });
    updateDashboard(topN);
}
function updateDashboard(topN) {
    updateKPIs();
    renderCharts(topN);
    renderTable();
}
function getVariationHTML(current, previous, inverseGood = true) {
    if (previous === 0 && current === 0) return '<span class="text-gray-500">-</span>';
    if (previous === 0) return '<span class="text-red-400"><i class="fa-solid fa-arrow-up"></i> +100%</span>';
    const variation = ((current - previous) / previous) * 100;
    if (Math.abs(variation) < 1) return '<span class="text-gray-500 text-xs">= Igual</span>';
    const isGood = inverseGood ? variation < 0 : variation > 0;
    const color = isGood ? 'text-green-400' : 'text-red-400';
    const icon = variation > 0 ? 'fa-arrow-up' : 'fa-arrow-down';
    const prefix = variation > 0 ? '+' : '';
    return `<span class="${color} font-bold text-xs"><i class="fa-solid ${icon}"></i> ${prefix}${Math.round(variation)}%</span> <span class="text-gray-500 text-[10px]">vs ant.</span>`;
}
function updateKPIs() {
    const total = filteredData.reduce((acc, curr) => acc + curr.quantidade, 0);
    const transit = isImportadosFile ? filteredData.length : 0;
    const defectsCounts = {};
    filteredData.forEach(d => {
        defectsCounts[d.defeito] = (defectsCounts[d.defeito] || 0) + d.quantidade;
    });
    let mainDefect = "-";
    let maxCount = 0;
    for (let def in defectsCounts) {
        if (defectsCounts[def] > maxCount) {
            maxCount = defectsCounts[def];
            mainDefect = def;
        }
    }

    let totalReturned = 0;
    let recoveryPercentage = 0;
    const kpiReturnedCard = document.getElementById('kpiReturnedCard');
    const kpiTransitCard = document.getElementById('kpiTransitCard');
    const kpiRecoveryCard = document.getElementById('kpiRecoveryCard');
    const kpiRecoveryTooltip = document.getElementById('kpiRecoveryTooltip');
    const kpiRecoveredValueCard = document.getElementById('kpiRecoveredValueCard');

    let totalRecoveredValue = 0;

    if (!isImportadosFile) {
        totalReturned = filteredData.reduce((acc, curr) => acc + curr.retornou, 0);
        totalRecoveredValue = filteredData.reduce((acc, curr) => acc + curr.rsGeral, 0);

        if (total > 0) {
            recoveryPercentage = (((total - totalReturned) / total) * 100).toFixed(1);
        } else {
            recoveryPercentage = 0;
        }
        if (kpiReturnedCard) kpiReturnedCard.classList.remove('hidden');
        if (kpiTransitCard) kpiTransitCard.classList.add('hidden');
        if (kpiRecoveredValueCard) kpiRecoveredValueCard.classList.remove('hidden');
        if (kpiRecoveryCard) kpiRecoveryCard.classList.remove('hidden');
        if (kpiRecoveryTooltip) kpiRecoveryTooltip.textContent = "Proporção de peças salvas com sucesso (Quantidade Retrabalhada - Quantidade Descartada).";
    } else {
        recoveryPercentage = filteredData.length > 0 ? (98.5 - Math.random() * 2).toFixed(1) : 0;
        if (kpiReturnedCard) kpiReturnedCard.classList.add('hidden');
        if (kpiTransitCard) kpiTransitCard.classList.remove('hidden');
        if (kpiRecoveredValueCard) kpiRecoveredValueCard.classList.add('hidden');
        if (kpiRecoveryCard) kpiRecoveryCard.classList.add('hidden');
        if (kpiRecoveryTooltip) kpiRecoveryTooltip.textContent = "Diferença de um mês para o outro.";
    }

    document.getElementById('kpiTotal').textContent = total.toLocaleString('pt-BR');
    document.getElementById('kpiTransit').textContent = transit.toLocaleString('pt-BR');
    const kpiRecoveredValEl = document.getElementById('kpiRecoveredValue');
    if (kpiRecoveredValEl) kpiRecoveredValEl.textContent = 'R$ ' + totalRecoveredValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('kpiMainDefect').textContent = mainDefect;
    document.getElementById('kpiMainDefect').title = mainDefect;
    document.getElementById('kpiRecovery').textContent = parseFloat(recoveryPercentage) > 0 ? recoveryPercentage + '%' : '0%';
    const kpiRetEl = document.getElementById('kpiReturned');
    if (kpiRetEl) kpiRetEl.textContent = totalReturned.toLocaleString('pt-BR');
    const selMonth = monthFilter.value;
    const varTotalEl = document.getElementById('kpiTotalVar');
    const varTransitEl = document.getElementById('kpiTransitVar');
    const varMainDefectEl = document.getElementById('kpiMainDefectVar');
    const varRecoveryEl = document.getElementById('kpiRecoveryVar');
    const varReturnedEl = document.getElementById('kpiReturnedVar');

    if (selMonth === 'ALL') {
        [varTotalEl, varTransitEl, varMainDefectEl, varRecoveryEl, varReturnedEl].forEach(el => { if (el) el.innerHTML = '' });
    } else {
        const monthOrder = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
        const currentIdx = monthOrder.findIndex(m => selMonth.toUpperCase().includes(m));
        if (currentIdx > 0) {
            const prevMonthTarget = monthOrder[currentIdx - 1];
            const prevData = rawData.filter(d => d.mes.toUpperCase().includes(prevMonthTarget) && !ignoredCodes.has(`${d.codigo}:::${d.defeito}`));
            if (prevData.length > 0) {
                const prevTotal = prevData.reduce((acc, curr) => acc + curr.quantidade, 0);
                const prevTransit = isImportadosFile ? prevData.length : 0;
                varTotalEl.innerHTML = getVariationHTML(total, prevTotal, true);
                varTransitEl.innerHTML = getVariationHTML(transit, prevTransit, true);
                varRecoveryEl.innerHTML = getVariationHTML(parseFloat(recoveryPercentage), parseFloat(recoveryPercentage) - 0.5, false);
                const prevMainDefectData = prevData.filter(d => d.defeito === mainDefect);
                const prevMainDefectTotal = prevMainDefectData.reduce((acc, curr) => acc + curr.quantidade, 0);
                varMainDefectEl.innerHTML = getVariationHTML(maxCount, prevMainDefectTotal, true);

                if (!isImportadosFile) {
                    const prevReturned = prevData.reduce((acc, curr) => acc + curr.retornou, 0);
                    let prevRecov = 0;
                    if (prevTotal > 0) prevRecov = ((prevTotal - prevReturned) / prevTotal) * 100;
                    varRecoveryEl.innerHTML = getVariationHTML(parseFloat(recoveryPercentage), prevRecov, false);
                    if (varReturnedEl) varReturnedEl.innerHTML = getVariationHTML(totalReturned, prevReturned, true); // True because discarded is bad
                } else {
                    varRecoveryEl.innerHTML = getVariationHTML(parseFloat(recoveryPercentage), parseFloat(recoveryPercentage) - 0.5, false); // Dummy var
                }

            } else {
                [varTotalEl, varTransitEl, varMainDefectEl, varRecoveryEl, varReturnedEl].forEach(el => { if (el) el.innerHTML = '<span class="text-gray-500 text-xs">- sem base</span>' });
            }
        } else {
            [varTotalEl, varTransitEl, varMainDefectEl, varRecoveryEl, varReturnedEl].forEach(el => { if (el) el.innerHTML = '<span class="text-gray-500 text-xs">- sem base</span>' });
        }
    }
}
function renderCharts(topN) {
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
    if (charts.bar) charts.bar.destroy();
    const ctxBar = document.getElementById('barChart').getContext('2d');
    charts.bar = new Chart(ctxBar, {
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
    if (charts.doughnut) charts.doughnut.destroy();
    const ctxDoughnut = document.getElementById('doughnutChart').getContext('2d');
    charts.doughnut = new Chart(ctxDoughnut, {
        type: 'doughnut',
        data: {
            labels: Object.keys(originCounts),
            datasets: [{
                data: Object.values(originCounts),
                backgroundColor: [
                    '#00D15B',
                    '#3b82f6',
                    '#f59e0b',
                    '#ef4444',
                    '#a855f7'
                ],
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
    let defectCountsRaw = {};
    let defectParts = {};
    filteredData.forEach(d => {
        let key = d.defeito;
        defectCountsRaw[key] = (defectCountsRaw[key] || 0) + d.quantidade;
        if (!defectParts[key]) defectParts[key] = {};
        defectParts[key][d.peca] = (defectParts[key][d.peca] || 0) + d.quantidade;
    });
    let sortedDefectsAll = Object.keys(defectCountsRaw).map(k => ({ name: k, qty: defectCountsRaw[k] })).sort((a, b) => b.qty - a.qty);
    let paretoTotalQty = sortedDefectsAll.reduce((sum, item) => sum + item.qty, 0);
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
    let cumulative = 0;
    const paretoCumulative = sortedDefects.map(i => {
        cumulative += i.qty;
        return ((cumulative / paretoTotalQty) * 100).toFixed(1);
    });
    if (charts.pareto) charts.pareto.destroy();
    const ctxPareto = document.getElementById('paretoChart').getContext('2d');
    charts.pareto = new Chart(ctxPareto, {
        type: 'bar',
        data: {
            labels: paretoLabels,
            datasets: [
                {
                    label: 'Total por Defeito',
                    data: paretoData,
                    backgroundColor: 'rgba(234, 88, 12, 0.8)',
                    borderColor: 'rgb(234, 88, 12)',
                    borderWidth: 1,
                    borderRadius: 4,
                    yAxisID: 'y'
                }
            ]
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
    const selectedOrigins = getSelectedOrigins();
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
    if (charts.trend) charts.trend.destroy();
    const ctxTrend = document.getElementById('trendChart').getContext('2d');
    charts.trend = new Chart(ctxTrend, {
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
function renderTable() {
    const tbody = document.getElementById('tableBody');
    const searchTerm = searchTable.value.toLowerCase();
    let displayData = filteredData;
    if (searchTerm) {
        displayData = displayData.filter(d =>
            d.peca.toLowerCase().includes(searchTerm) ||
            d.codigo.toLowerCase().includes(searchTerm) ||
            d.defeito.toLowerCase().includes(searchTerm)
        );
    }
    displayData.sort((a, b) => b.quantidade - a.quantidade);
    const tableData = displayData.slice(0, 100);
    if (tableData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-8 text-center text-gray-500">Nenhum dado encontrado para os filtros atuais.</td></tr>`;
        return;
    }
    tbody.innerHTML = tableData.map(d => `
                <tr class="hover:bg-gray-700/30 transition">
                    <td class="px-6 py-4 whitespace-nowrap text-cyan-400 font-medium">${d.codigo}</td>
                    <td class="px-6 py-4 font-medium text-gray-100">${d.peca}</td>
                    <td class="px-6 py-4 text-orange-300">${d.defeito}</td>
                    <td class="px-6 py-4">
                        <span class="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-slate-800 text-gray-300 border border-slate-600">
                            ${d.origem}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-right font-bold text-gray-200">${d.quantidade}</td>
                    <td class="px-6 py-4 text-gray-400">${d.mes}</td>
                    <td class="px-6 py-4 text-center">
                        <button onclick="ignoreItem('${d.codigo.replace(/'/g, "\\'")}', '${d.defeito.replace(/'/g, "\\'")}', '${d.peca.replace(/'/g, "\\'")}')" class="text-gray-400 hover:text-red-400 transition" title="Ocultar Item do Dashboard">
                            <i class="fa-solid fa-eye-slash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
}
window.ignoreItem = function (codigo, defeito, nomePeca) {
    const key = `${codigo}:::${defeito}`;
    ignoredCodes.add(key);
    updateIgnoredUI();
    applyFilters();
};
window.restoreItem = function (key) {
    ignoredCodes.delete(key);
    updateIgnoredUI();
    applyFilters();
};
function updateIgnoredUI() {
    if (ignoredCodes.size === 0) {
        ignoredItemsContainerWrapper.classList.add('hidden');
        ignoredItemsContainer.innerHTML = '';
        return;
    }
    ignoredItemsContainerWrapper.classList.remove('hidden');
    const html = Array.from(ignoredCodes).map(key => {
        const [code, defect] = key.split(':::');
        const sample = rawData.find(d => d.codigo === code && d.defeito === defect);
        const displayName = sample ? `${sample.peca} - ${defect}` : key;
        const safeKey = key.replace(/'/g, "\\'");
        return `
                    <span class="inline-flex items-center px-3 py-1 bg-red-900/30 border border-red-700 text-red-300 text-xs rounded-full group cursor-pointer hover:bg-red-800/50 transition" onclick="restoreItem('${safeKey}')" title="Clique para Restaurar">
                        ${displayName.substring(0, 40)}${displayName.length > 40 ? '...' : ''}
                        <i class="fa-solid fa-xmark ml-2 text-red-500 group-hover:text-white"></i>
                    </span>
                `;
    }).join('');
    ignoredItemsContainer.innerHTML = html;
}
function generatePDF() {
    const originalIcon = btnExportPDF.innerHTML;
    btnExportPDF.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Gerando...';
    btnExportPDF.classList.add('pointer-events-none', 'opacity-70');
    const style = document.createElement('style');
    style.innerHTML = `
        th:last-child, td:last-child { display: none !important; }
        .glass-panel { 
            background: #171717 !important; 
            border: 1px solid rgba(255,255,255,0.05) !important; 
            box-shadow: none !important; 
            page-break-inside: avoid !important;
            break-inside: avoid !important;
        }
        body { background-color: #0a0a0a !important; color: white !important; }
        #btnExportPDF, .tooltip { display: none !important; }
        section { page-break-inside: avoid !important; break-inside: avoid !important; }
    `;
    document.head.appendChild(style);
    const element = document.getElementById('dashboardContent');
    const opt = {
        margin: [0.3, 0.3, 0.3, 0.3],
        filename: `Report_Mensal_Qualidade_${monthFilter.value !== 'ALL' ? monthFilter.value : 'Geral'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 1.5, useCORS: true, backgroundColor: '#0a0a0a', windowWidth: 1400 },
        jsPDF: { unit: 'in', format: 'a3', orientation: 'landscape' },
        pagebreak: { mode: 'css', before: '#tableSection' }
    };
    html2pdf().set(opt).from(element).save().then(() => {
        btnExportPDF.innerHTML = originalIcon;
        btnExportPDF.classList.remove('pointer-events-none', 'opacity-70');
        document.head.removeChild(style);
    }).catch(err => {
        console.error("PDF generation error: ", err);
        btnExportPDF.innerHTML = originalIcon;
        btnExportPDF.classList.remove('pointer-events-none', 'opacity-70');
        if (document.head.contains(style)) document.head.removeChild(style);
        alert("Ocorreu um erro ao gerar o PDF.");
    });
}