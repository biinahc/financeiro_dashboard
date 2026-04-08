import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import type { ParsedDataRow } from '../types/dashboard';
import { colAliases, findColumnKey, processRowData } from '../utils/excelParser';

export function useExcelLoader() {
  const [rawData, setRawData] = useState<ParsedDataRow[]>([]);
  const [isImportadosFile, setIsImportadosFile] = useState(false);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [availableOrigins, setAvailableOrigins] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadFile = useCallback((file: File) => {
    setIsLoading(true);
    setIsImportadosFile(file.name.toLowerCase().includes('importado'));

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        if (!data) return;

        const workbook = XLSX.read(data, { type: 'binary' });
        const newRawData: ParsedDataRow[] = [];
        const monthsSet = new Set<string>();
        const originsSet = new Set<string>();

        workbook.SheetNames.forEach(sheetName => {
          const sheet = workbook.Sheets[sheetName];
          const rawRows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' });
          if (rawRows.length === 0) return;

          let headerRowIndex = -1;
          let bestColMap: any = null;
          let maxMatches = 0;

          // Search header in first 10 rows
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

            let matches = 0;
            if (colMap.peca) matches++;
            if (colMap.quantidade) matches++;
            if (colMap.defeito) matches++;
            if (colMap.origem) matches++;
            if (colMap.codigo) matches++;
            if (colMap.mes || colMap.dataExact) matches++;

            if (matches > maxMatches) {
              maxMatches = matches;
              headerRowIndex = i;
              bestColMap = colMap;
            }
          }

          if (maxMatches < 2 || !bestColMap.quantidade) {
            if (sheetName.toLowerCase() !== 'codigo') {
              console.warn(`Aba "${sheetName}" ignorada por não encontrar colunas chave suficientes.`);
            }
            return;
          }

          const headers = rawRows[headerRowIndex];
          for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
            const rowArr = rawRows[i];
            const rowObj: Record<string, string | number> = {};
            
            headers.forEach((h, idx) => {
              if (h) rowObj[h] = rowArr[idx];
            });

            const values = Object.values(rowObj).join('').trim();
            if (!values) continue;

            const parsed = processRowData(rowObj, bestColMap);
            
            const descPeca = parsed.peca.toLowerCase();
            const descOrigem = parsed.origem.toLowerCase();
            const descDefeito = parsed.defeito.toLowerCase();
            const descCodigo = parsed.codigo.toLowerCase();

            if (descPeca.includes('total') || descPeca === 'soma' || descPeca === 'total geral' ||
                descDefeito.includes('total') || descOrigem.includes('total') || descCodigo.includes('total') ||
                descPeca.includes('desconhecida') || descCodigo.includes('clique') || descCodigo === '-') {
                continue;
            }

            if (!bestColMap.mes || parsed.mes === 'Geral') {
                const monthsRegex = /janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez/i;
                if (monthsRegex.test(sheetName)) {
                    const monthMap: Record<string, string> = {
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
            } else {
                parsed.mes = parsed.mes.toUpperCase();
            }

            if (parsed.quantidade > 0) {
                newRawData.push(parsed);
                monthsSet.add(parsed.mes);
                originsSet.add(parsed.origem);
            }
          }
        });

        const arrOrigins = Array.from(originsSet).sort();
        setAvailableOrigins(arrOrigins);
        setAvailableMonths(Array.from(monthsSet).sort());
        setRawData(newRawData);
      } catch (err) {
        console.error("Erro processando excel", err);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  }, []);

  return { loadFile, rawData, isImportadosFile, availableOrigins, availableMonths, isLoading };
}
