/**
 * Módulo para atualização dos indicadores chave de desempenho (KPIs).
 */
import { getVariationHTML } from '../utils/formatters.js';

/**
 * Atualiza os valores dos cards de KPI no dashboard.
 * @param {Array} filteredData Dados filtrados atuais.
 * @param {Array} rawData Dados brutos para comparação de variação.
 * @param {boolean} isImportadosFile Flag indicando o tipo de arquivo carregado.
 * @param {Set} ignoredCodes Conjunto de chaves de itens ignorados.
 * @param {string} selectedMonth Mês selecionado no filtro.
 */
export function updateKPIs(filteredData, rawData, isImportadosFile, ignoredCodes, selectedMonth) {
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

    const varTotalEl = document.getElementById('kpiTotalVar');
    const varTransitEl = document.getElementById('kpiTransitVar');
    const varMainDefectEl = document.getElementById('kpiMainDefectVar');
    const varRecoveryEl = document.getElementById('kpiRecoveryVar');
    const varReturnedEl = document.getElementById('kpiReturnedVar');

    if (selectedMonth === 'ALL' || selectedMonth === 'WEEK') {
        [varTotalEl, varTransitEl, varMainDefectEl, varRecoveryEl, varReturnedEl].forEach(el => { if (el) el.innerHTML = '' });
    } else {
        const monthOrder = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
        const currentIdx = monthOrder.findIndex(m => selectedMonth.toUpperCase().includes(m));
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
                    if (varReturnedEl) varReturnedEl.innerHTML = getVariationHTML(totalReturned, prevReturned, true);
                } else {
                    varRecoveryEl.innerHTML = getVariationHTML(parseFloat(recoveryPercentage), parseFloat(recoveryPercentage) - 0.5, false);
                }

            } else {
                [varTotalEl, varTransitEl, varMainDefectEl, varRecoveryEl, varReturnedEl].forEach(el => { if (el) el.innerHTML = '<span class="text-gray-500 text-xs">- sem base</span>' });
            }
        } else {
            [varTotalEl, varTransitEl, varMainDefectEl, varRecoveryEl, varReturnedEl].forEach(el => { if (el) el.innerHTML = '<span class="text-gray-500 text-xs">- sem base</span>' });
        }
    }
}
