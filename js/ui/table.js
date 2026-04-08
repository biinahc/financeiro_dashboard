/**
 * Módulo para renderização da tabela de dados.
 */

/**
 * Renderiza a tabela de itens filtrados.
 * @param {Array} filteredData Dados filtrados para exibição.
 * @param {string} searchTerm Termo de busca digitado pelo usuário.
 */
export function renderTable(filteredData, searchTerm) {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;

    let displayData = filteredData;
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        displayData = displayData.filter(d =>
            d.peca.toLowerCase().includes(term) ||
            d.codigo.toLowerCase().includes(term) ||
            d.defeito.toLowerCase().includes(term)
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
