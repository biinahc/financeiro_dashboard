export interface ParsedDataRow {
  codigo: string;
  peca: string;
  defeito: string;
  quantidade: number;
  retornou: number;
  rsUnitario: number;
  rsGeral: number;
  origem: string;
  mes: string;
  dataValue: Date | null;
}

export type RawExcelRow = Record<string, string | number>;

export interface FilterState {
  month: string;
  startDate: string | null;
  endDate: string | null;
  topN: number;
  origins: string[];
  ignoredItems: Set<string>; // 'codigo:::defeito'
}

export interface ColAliasesMap {
  peca: string | null;
  quantidade: string | null;
  defeito: string | null;
  origem: string | null;
  codigo: string | null;
  mes: string | null;
  dataExact: string | null;
  retornou: string | null;
  rsUnitario: string | null;
  rsGeral: string | null;
}
