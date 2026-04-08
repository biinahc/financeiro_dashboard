/**
 * Normaliza o cabeçalho removendo quebras de linha e espaços extras.
 * @param {string} header Cabeçalho da coluna.
 * @returns {string} Cabeçalho normalizado.
 */
export function normalizeHeader(header) {
    return header.toString().toLowerCase().trim().replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');
}

/**
 * Procura por uma chave de coluna em uma lista de cabeçalhos baseando-se em aliases.
 * @param {string[]} headers Lista de cabeçalhos da planilha.
 * @param {string[]} aliasList Lista de possíveis nomes para a coluna.
 * @returns {string|null} Nome da coluna encontrado ou null.
 */
export function findColumnKey(headers, aliasList) {
    for (let header of headers) {
        let norm = normalizeHeader(header);
        if (aliasList.some(alias => norm.includes(alias))) return header;
    }
    return null;
}

/**
 * Processa uma linha bruta da planilha e a converte no formato interno do dashboard.
 * @param {Object} row Linha bruta da planilha (JSON).
 * @param {Object} colMap Mapeamento de colunas identificadas.
 * @returns {Object} Objeto de dados processado.
 */
export function processRowData(row, colMap) {
    let qty = row[colMap.quantidade];
    if (typeof qty === 'string') qty = parseInt(qty.replace(/\D/g, '')) || 0;
    let origem = (row[colMap.origem] || 'Não Informado').toString().trim();
    if (origem.toLowerCase() === 'forn') origem = 'Fornecedor';
    else if (origem.toLowerCase() === 'proc') origem = 'Processo';
    
    let mesStr = 'Geral';
    let rowDate = null;
    
    if (colMap.dataExact && row[colMap.dataExact]) {
        const rawDataEx = row[colMap.dataExact];
        if (typeof rawDataEx === 'number') {
            let utcMs = Math.round((rawDataEx - 25569) * 86400 * 1000);
            let dUtc = new Date(utcMs);
            rowDate = new Date(dUtc.getUTCFullYear(), dUtc.getUTCMonth(), dUtc.getUTCDate());
        } else {
            let str = String(rawDataEx).trim();
            let parts = str.split('/');
            if (parts.length === 3) {
                let y = parseInt(parts[2], 10);
                if (y < 100) y += 2000;
                rowDate = new Date(y, parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
            } else {
                let tDate = new Date(str);
                if (!isNaN(tDate.getTime())) rowDate = tDate;
            }
        }
    }

    if (colMap.mes && row[colMap.mes]) {
        const rawMes = row[colMap.mes];
        if (typeof rawMes === 'number') {
            let utcMs = Math.round((rawMes - 25569) * 86400 * 1000);
            let dUtc = new Date(utcMs);
            let tempDate = new Date(dUtc.getUTCFullYear(), dUtc.getUTCMonth(), dUtc.getUTCDate());
            if (!rowDate) rowDate = tempDate;
            mesStr = tempDate.toLocaleString('pt-BR', { month: 'long' });
        } else {
            mesStr = String(rawMes).trim();
            if (!rowDate) {
                let parts = mesStr.split('/');
                if (parts.length === 3) {
                    let y = parseInt(parts[2], 10);
                    if (y < 100) y += 2000;
                    rowDate = new Date(y, parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
                }
            }
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
        mes: mesStr,
        dataValue: rowDate
    };
}
