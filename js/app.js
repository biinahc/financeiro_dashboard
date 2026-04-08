/**
 * app.js - Controlador Principal (Orquestrador)
 * Gerencia a integração entre serviços de dados, lógica de filtros e componentes de UI.
 */

// --- Imports ---

// Core & Config
import { state } from './core/state.js';
import { colAliases } from './core/config.js';

// Utilitários
import { getVariationHTML } from './utils/formatters.js';

// Serviços de Lógica e Dados
import { normalizeHeader, findColumnKey, processRowData } from './services/dataService.js';
import * as filterService from './services/filterService.js';

// Componentes de Interface (UI)
import { renderCharts } from './ui/charts.js';
import { renderTable } from './ui/table.js';
import { updateKPIs } from './ui/kpis.js';

// --- Referências do DOM ---

const fileUpload = document.getElementById('fileUpload');
const monthFilter = document.getElementById('monthFilter');
const weekFilterContainer = document.getElementById('weekFilterContainer');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const topNSlider = document.getElementById('topNSlider');
const topNValue = document.getElementById('topNValue');
const originFiltersContainer = document.getElementById('originFiltersContainer');
const searchTable = document.getElementById('searchTable');
const ignoredItemsContainerWrapper = document.getElementById('ignoredItemsContainerWrapper');
const ignoredItemsContainer = document.getElementById('ignoredItemsContainer');
const btnExportPDF = document.getElementById('btnExportPDF');
const spreadsheetTitleContainer = document.getElementById('spreadsheetTitleContainer');
const spreadsheetTitle = document.getElementById('spreadsheetTitle');
const kpiTotalLabel = document.getElementById('kpiTotalLabel');

// --- Configurações Globais ---

Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = "'Inter', sans-serif";

// --- Listeners de Evento ---

fileUpload.addEventListener('change', handleFileUpload);

monthFilter.addEventListener('change', () => {
    if (monthFilter.value === 'WEEK') {
        weekFilterContainer.classList.remove('hidden');
    } else {
        weekFilterContainer.classList.add('hidden');
    }
    applyFilters();
});

startDateInput.addEventListener('change', applyFilters);
endDateInput.addEventListener('change', applyFilters);

topNSlider.addEventListener('input', (e) => {
    if (topNValue) topNValue.textContent = e.target.value;
    applyFilters();
});

searchTable.addEventListener('input', () => {
    renderTable(state.filteredData, searchTable.value);
});

btnExportPDF.addEventListener('click', generatePDF);

// --- Processamento de Arquivos ---

/**
 * Gerencia o upload e a extração inicial de dados da planilha.
 * @param {Event} e Evento de mudança do input de arquivo.
 */
async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    state.isImportadosFile = file.name.toLowerCase().includes('importado');
    const reader = new FileReader();

    reader.onload = function (evt) {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        state.rawData = [];
        const monthsSet = new Set();

        if (spreadsheetTitleContainer && spreadsheetTitle) {
            spreadsheetTitle.textContent = file.name;
            spreadsheetTitleContainer.classList.remove('hidden');
        }

        if (kpiTotalLabel) {
            kpiTotalLabel.textContent = state.isImportadosFile ? 'Total de Materiais Não Conforme' : 'Total Retrabalhado';
        }

        workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

            if (rawRows.length === 0) return;

            // Busca automática da linha de cabeçalho
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
                    dataExact: findColumnKey(row, colAliases.dataExact),
                    retornou: findColumnKey(row, colAliases.retornou),
                    rsUnitario: findColumnKey(row, colAliases.rsUnitario),
                    rsGeral: findColumnKey(row, colAliases.rsGeral)
                };

                let matches = Object.values(colMap).filter(v => v !== null).length;
                if (matches > maxMatches) {
                    maxMatches = matches;
                    headerRowIndex = i;
                    bestColMap = colMap;
                }
            }

            if (maxMatches < 2 || !bestColMap.quantidade) return;

            const headers = rawRows[headerRowIndex];
            for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
                const rowArr = rawRows[i];
                const rowObj = {};
                headers.forEach((h, idx) => { if (h) rowObj[h] = rowArr[idx]; });

                if (!Object.values(rowObj).join('').trim()) continue;

                let parsed = processRowData(rowObj, bestColMap);

                // Filtros de exclusão de ruído/totais
                const descPeca = String(parsed.peca).toLowerCase();
                const descCodigo = String(parsed.codigo).toLowerCase();
                if (descPeca.includes('total') || descPeca === 'soma' || descCodigo === '-') continue;

                // Lógica de Mês (Herança da Aba se necessário)
                if (!bestColMap.mes || parsed.mes === 'Geral') {
                    const monthsRegex = /janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez/i;
                    if (monthsRegex.test(sheetName)) {
                        const monthMap = {
                            'jan': 'JANEIRO', 'fev': 'FEVEREIRO', 'mar': 'MARÇO', 'abr': 'ABRIL',
                            'mai': 'MAIO', 'jun': 'JUNHO', 'jul': 'JULHO', 'ago': 'AGOSTO',
                            'set': 'SETEMBRO', 'out': 'OUTUBRO', 'nov': 'NOVEMBRO', 'dez': 'DEZEMBRO'
                        };
                        let matchedName = sheetName.toLowerCase().trim();
                        parsed.mes = monthMap[matchedName] || sheetName.toUpperCase();
                    }
                } else {
                    parsed.mes = parsed.mes.toUpperCase();
                }

                if (parsed.quantidade > 0) {
                    state.rawData.push(parsed);
                    monthsSet.add(parsed.mes);
                }
            }
        });

        updateMonthFilter(Array.from(monthsSet));
        updateOriginFilters();
        applyFilters();

        if (btnExportPDF) btnExportPDF.classList.remove('hidden');
    };
    reader.readAsBinaryString(file);
}

// --- Helpers de Interface ---

/**
 * Atualiza dinamicamente os filtros de origem baseados no conteúdo da planilha.
 */
function updateOriginFilters() {
    const origins = new Set(state.rawData.map(d => d.origem));
    originFiltersContainer.innerHTML = '';

    if (origins.size === 0) {
        originFiltersContainer.innerHTML = '<span class="text-secondary text-sm">Nenhuma origem encontrada.</span>';
        return;
    }

    Array.from(origins).sort().forEach(origem => {
        const label = document.createElement('label');
        label.className = 'inline-flex items-center cursor-pointer mb-2 mr-4';
        label.innerHTML = `
            <input type="checkbox" value="${origem}" checked class="origin-filter-checkbox form-checkbox text-primary h-5 w-5 rounded border-gray-600 bg-cardBg focus:ring-primary">
            <span class="ml-2 text-gray-300 text-sm">${origem}</span>
        `;
        label.querySelector('input').addEventListener('change', applyFilters);
        originFiltersContainer.appendChild(label);
    });
}

/**
 * Atualiza o seletor de meses disponível na UI.
 * @param {string[]} months Lista de meses encontrados nos dados.
 */
function updateMonthFilter(months) {
    monthFilter.innerHTML = '<option value="ALL">Todos os Meses</option>';
    months.sort().forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m.charAt(0).toUpperCase() + m.slice(1).toLowerCase();
        monthFilter.appendChild(opt);
    });

    if (state.isImportadosFile) {
        const optWeek = document.createElement('option');
        optWeek.value = 'WEEK';
        optWeek.textContent = 'Por Semana / Período';
        monthFilter.appendChild(optWeek);
    }

    weekFilterContainer.classList.toggle('hidden', monthFilter.value !== 'WEEK');
}

/**
 * Atualiza a interface da lista de itens ocultados.
 */
function updateIgnoredUI() {
    if (state.ignoredCodes.size === 0) {
        ignoredItemsContainerWrapper.classList.add('hidden');
        ignoredItemsContainer.innerHTML = '';
        return;
    }

    ignoredItemsContainerWrapper.classList.remove('hidden');
    ignoredItemsContainer.innerHTML = Array.from(state.ignoredCodes).map(key => {
        const [code, defect] = key.split(':::');
        const sample = state.rawData.find(d => d.codigo === code && d.defeito === defect);
        const displayName = sample ? `${sample.peca} - ${defect}` : key;
        const safeKey = key.replace(/'/g, "\\'");
        
        return `
            <span class="inline-flex items-center px-3 py-1 bg-red-900/30 border border-red-700 text-red-300 text-xs rounded-full group cursor-pointer hover:bg-red-800/50 transition" 
                  onclick="restoreItem('${safeKey}')" title="Clique para Restaurar">
                ${displayName.substring(0, 40)}${displayName.length > 40 ? '...' : ''}
                <i class="fa-solid fa-xmark ml-2 text-red-500 group-hover:text-white"></i>
            </span>
        `;
    }).join('');
}

// --- Coordenação de Filtros e UI ---

/**
 * Coordenador central de filtros. Lê entradas da UI e delega a lógica para o filterService.
 */
function applyFilters() {
    const selMonth = monthFilter.value;
    const topN = parseInt(topNSlider.value);
    const selectedOrigins = filterService.getSelectedOrigins();

    let startD = startDateInput.value ? new Date(startDateInput.value + 'T00:00:00') : null;
    let endD = endDateInput.value ? new Date(endDateInput.value + 'T23:59:59') : null;

    filterService.applyFilters(selMonth, startD, endD, selectedOrigins);
    updateDashboard(topN);
}

/**
 * Dispara a renderização completa de todos os componentes de UI do dashboard.
 * @param {number} topN Configuração de limite para os gráficos de ranking.
 */
function updateDashboard(topN) {
    updateKPIs(state.filteredData, state.rawData, state.isImportadosFile, state.ignoredCodes, monthFilter.value);
    renderCharts(topN, state.filteredData, state.rawData, filterService.getSelectedOrigins());
    renderTable(state.filteredData, searchTable.value);
}

// --- Funções de Gestão de Itens Ocultos (Globals) ---

window.ignoreItem = function (codigo, defeito) {
    filterService.ignoreItem(codigo, defeito);
    updateIgnoredUI();
    applyFilters();
};

window.restoreItem = function (key) {
    filterService.restoreItem(key);
    updateIgnoredUI();
    applyFilters();
};

// --- Exportação ---

/**
 * Gera o relatório PDF do conteúdo visível do dashboard.
 */
function generatePDF() {
    const originalIcon = btnExportPDF.innerHTML;
    btnExportPDF.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Gerando...';
    btnExportPDF.classList.add('pointer-events-none', 'opacity-70');

    const style = document.createElement('style');
    style.innerHTML = `
        th:last-child, td:last-child { display: none !important; }
        .glass-panel { background: #171717 !important; border: 1px solid rgba(255,255,255,0.05) !important; box-shadow: none !important; }
        body { background-color: #0a0a0a !important; color: white !important; }
        #btnExportPDF, .tooltip { display: none !important; }
        section { page-break-inside: avoid !important; break-inside: avoid !important; }
    `;
    document.head.appendChild(style);

    const element = document.getElementById('dashboardContent');
    const opt = {
        margin: [0.3, 0.3, 0.3, 0.3],
        filename: `Report_Qualidade_${monthFilter.value !== 'ALL' ? monthFilter.value : 'Geral'}.pdf`,
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
        console.error("PDF Fail:", err);
        btnExportPDF.innerHTML = originalIcon;
        btnExportPDF.classList.remove('pointer-events-none', 'opacity-70');
        if (document.head.contains(style)) document.head.removeChild(style);
        alert("Erro ao gerar PDF.");
    });
}
