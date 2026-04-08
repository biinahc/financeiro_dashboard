import type { ColAliasesMap, ParsedDataRow } from '../types/dashboard';

export const colAliases = {
  peca: ['peça', 'nome', 'produto', 'item', 'descrição da peça', 'descricao da peca', 'part', 'material não conforme', 'material nao conforme'],
  quantidade: ['quantidade', 'qtd', 'qtde', 'total', 'qt total', 'qtd total', 'qntd'],
  defeito: ['problema', 'defeito', 'falha', 'motivo', 'nqm', 'não conformidade', 'descrição defeito', 'descricao defeito'],
  origem: ['origem', 'fornecedor', 'processo', 'causa'],
  codigo: ['código', 'codigo', 'cod', 'pn', 'part number', 'cód'],
  mes: ['mês', 'mes', 'periodo', 'período'],
  dataExact: ['dia', 'data', 'criado em', 'data de criação'],
  retornou: ['retornou', 'descartadas', 'descarte', 'retorno'],
  rsUnitario: ['r$ unitário', 'unitário', 'valor unitario', 'r$ unitario'],
  rsGeral: ['r$ geral', 'geral', 'valor total', 'valor geral']
};

export function normalizeHeader(header: string | number | unknown): string {
  if (!header) return '';
  return header.toString().toLowerCase().trim().replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');
}

export function findColumnKey(headers: string[], aliasList: string[]): string | null {
  for (let header of headers) {
    let norm = normalizeHeader(header);
    if (aliasList.some((alias) => norm.includes(alias))) return header;
  }
  return null;
}

export function processRowData(row: Record<string, string | number | undefined>, colMap: ColAliasesMap): ParsedDataRow {
  let qty = row[colMap.quantidade as string];
  if (typeof qty === 'string') qty = parseInt(qty.replace(/\D/g, '')) || 0;
  
  let origem = (row[colMap.origem as string] || 'Não Informado').toString().trim();
  if (origem.toLowerCase() === 'forn') origem = 'Fornecedor';
  else if (origem.toLowerCase() === 'proc') origem = 'Processo';

  let mesStr = 'Geral';
  let rowDate: Date | null = null;

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

  let ret = row[colMap.retornou as string];
  if (typeof ret === 'string') ret = parseInt(ret.replace(/\D/g, '')) || 0;

  return {
    codigo: String(row[colMap.codigo as string] || '-'),
    peca: String(row[colMap.peca as string] || 'Desconhecida'),
    defeito: String(row[colMap.defeito as string] || 'Não Especificado'),
    quantidade: Number(qty) || 0,
    retornou: Number(ret) || 0,
    rsUnitario: Number(row[colMap.rsUnitario as string]) || 0,
    rsGeral: Number(row[colMap.rsGeral as string]) || 0,
    origem: origem,
    mes: mesStr,
    dataValue: rowDate
  };
}
