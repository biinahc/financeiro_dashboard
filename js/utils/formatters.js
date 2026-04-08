/**
 * Retorna o HTML formatado para exibir a variação entre o período atual e o anterior.
 * @param {number} current Valor do período atual.
 * @param {number} previous Valor do período anterior.
 * @param {boolean} inverseGood Se true, a queda é considerada positiva (ex: defeitos).
 * @returns {string} String HTML formatada.
 */
export function getVariationHTML(current, previous, inverseGood = true) {
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
