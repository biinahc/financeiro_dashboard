import type { FilterState, ParsedDataRow } from '../types/dashboard';

export function applyDataFilters(rawData: ParsedDataRow[], state: FilterState): ParsedDataRow[] {
  const selMonth = state.month;
  
  let startD: Date | null = state.startDate ? new Date(state.startDate + 'T00:00:00') : null;
  let endD: Date | null = state.endDate ? new Date(state.endDate + 'T23:59:59') : null;

  return rawData.filter(d => {
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
    
    const matchOrigin = state.origins.includes(d.origem);
    const isExcluded = state.ignoredItems.has(`${d.codigo}:::${d.defeito}`);
    
    return matchMonth && matchOrigin && !isExcluded;
  });
}
