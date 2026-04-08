/**
 * Módulo de serviços para lógica de filtragem e manipulação de estado de dados.
 */
import { state } from '../core/state.js';

/**
 * Coleta as origens selecionadas nos checkboxes do DOM.
 * @returns {string[]} Lista de origens marcadas.
 */
export function getSelectedOrigins() {
    const checkboxes = document.querySelectorAll('.origin-filter-checkbox');
    const selected = [];
    checkboxes.forEach(cb => {
        if (cb.checked) selected.push(cb.value);
    });
    return selected;
}

/**
 * Aplica as regras de filtragem aos dados brutos e atualiza o estado de dados filtrados.
 * @param {string} selMonth Mês selecionado no filtro (ou 'ALL' / 'WEEK').
 * @param {Date|null} startD Data de início para o período da semana.
 * @param {Date|null} endD Data de fim para o período da semana.
 * @param {string[]} selectedOrigins Lista de origens permitidas.
 */
export function applyFilters(selMonth, startD, endD, selectedOrigins) {
    state.filteredData = state.rawData.filter(d => {
        let matchMonth = false;
        if (selMonth === 'ALL') {
            matchMonth = true;
        } else if (selMonth === 'WEEK') {
            if (!startD && !endD) {
                matchMonth = true;
            } else if (d.dataValue) {
                let dTime = d.dataValue.getTime();
                let minTime = startD ? startD.getTime() : -Infinity;
                let maxTime = endD ? endD.getTime() : Infinity;
                matchMonth = dTime >= minTime && dTime <= maxTime;
            } else {
                matchMonth = false;
            }
        } else {
            matchMonth = (d.mes || '').toUpperCase() === selMonth.toUpperCase();
        }
        
        const matchOrigin = selectedOrigins.includes(d.origem);
        const isExcluded = state.ignoredCodes.has(`${d.codigo}:::${d.defeito}`);
        return matchMonth && matchOrigin && !isExcluded;
    });
}

/**
 * Adiciona um item à lista de itens ignorados no dashboard.
 * @param {string} codigo Código da peça.
 * @param {string} defeito Descrição do defeito.
 */
export function ignoreItem(codigo, defeito) {
    const key = `${codigo}:::${defeito}`;
    state.ignoredCodes.add(key);
}

/**
 * Remove um item da lista de itens ignorados.
 * @param {string} key Chave composta do item (PN:::Defeito).
 */
export function restoreItem(key) {
    state.ignoredCodes.delete(key);
}
