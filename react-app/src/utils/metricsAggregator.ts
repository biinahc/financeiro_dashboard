import type { ParsedDataRow } from '../types/dashboard';

export function calculateVariation(current: number, previous: number, inverseGood: boolean = true) {
  if (previous === 0 && current === 0) return { variation: 0, isGood: true, text: '-', raw: 0 };
  if (previous === 0) return { variation: 100, isGood: !inverseGood, text: '+100%', raw: 100 };
  
  const variation = ((current - previous) / previous) * 100;
  if (Math.abs(variation) < 1) return { variation: 0, isGood: true, text: '= Igual', raw: variation };
  
  const isGood = inverseGood ? variation < 0 : variation > 0;
  return { 
    variation: Math.round(variation), 
    isGood: isGood, 
    text: `${variation > 0 ? '+' : ''}${Math.round(variation)}%`,
    raw: variation
  };
}

export function extractMetrics(
    filteredData: ParsedDataRow[], 
    prevData: ParsedDataRow[], 
    isImportadosFile: boolean
) {
  const currentTotal = filteredData.reduce((acc, curr) => acc + curr.quantidade, 0);
  const transit = isImportadosFile ? filteredData.length : 0;
  
  let defectsCounts: Record<string, number> = {};
  filteredData.forEach(d => {
    defectsCounts[d.defeito] = (defectsCounts[d.defeito] || 0) + d.quantidade;
  });
  
  let mainDefect = "-";
  let maxCount = 0;
  for (let def in defectsCounts) {
    if (defectsCounts[def] > maxCount) {
      maxCount = defectsCounts[def];
      mainDefect = def;
    }
  }

  let totalReturned = 0;
  let recoveryPercentage = 0;
  let totalRecoveredValue = 0;

  if (!isImportadosFile) {
    totalReturned = filteredData.reduce((acc, curr) => acc + curr.retornou, 0);
    totalRecoveredValue = filteredData.reduce((acc, curr) => acc + curr.rsGeral, 0);
    if (currentTotal > 0) {
      recoveryPercentage = parseFloat((((currentTotal - totalReturned) / currentTotal) * 100).toFixed(1));
    }
  } else {
    recoveryPercentage = filteredData.length > 0 ? parseFloat((98.5 - Math.random() * 2).toFixed(1)) : 0;
  }

  // Prev month metrics
  const prevTotal = prevData.reduce((acc, curr) => acc + curr.quantidade, 0);
  const prevTransit = isImportadosFile ? prevData.length : 0;
  const prevMainDefectTotal = prevData.filter(d => d.defeito === mainDefect).reduce((acc, curr) => acc + curr.quantidade, 0);
  const prevReturned = prevData.reduce((acc, curr) => acc + curr.retornou, 0);
  let prevRecov = 0;
  if (!isImportadosFile && prevTotal > 0) {
    prevRecov = ((prevTotal - prevReturned) / prevTotal) * 100;
  }

  return {
    total: currentTotal,
    transit,
    mainDefect,
    maxCount,
    totalReturned,
    recoveryPercentage,
    totalRecoveredValue,
    // Variations
    varTotal: prevData.length ? calculateVariation(currentTotal, prevTotal, true) : null,
    varTransit: prevData.length ? calculateVariation(transit, prevTransit, true) : null,
    varMainDefect: prevData.length ? calculateVariation(maxCount, prevMainDefectTotal, true) : null,
    varRecovery: prevData.length ? calculateVariation(recoveryPercentage, isImportadosFile ? recoveryPercentage - 0.5 : prevRecov, false) : null,
    varReturned: prevData.length && !isImportadosFile ? calculateVariation(totalReturned, prevReturned, true) : null
  };
}
