/**
 * Estado centralizado da aplicação.
 * Armazena os dados carregados, filtrados e as preferências de exibição (itens ignorados).
 */
export const state = {
    /** @type {Array} Dados brutos extraídos da planilha Excel */
    rawData: [],
    
    /** @type {Array} Dados processados após aplicação de filtros de mês, origem e exclusões */
    filteredData: [],
    
    /** @type {Set} Identificadores únicos (PN + Defeito) de itens a serem ocultados */
    ignoredCodes: new Set(),
    
    /** @type {boolean} Indica se o arquivo carregado é de 'Importados' (logística) ou 'Retrabalho' (produção) */
    isImportadosFile: false
};
