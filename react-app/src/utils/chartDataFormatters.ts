import type { ParsedDataRow } from '../types/dashboard';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler } from 'chart.js';
import type { ChartData } from 'chart.js';

// Registrar os elementos globais da lib aqui (longe do componente)
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler);

// Definições de paleta da UI
const COLORS = {
  primary: '#00D15B',
  primaryDark: '#04a34b',
  accent: '#22c55e',
  orange: '#f97316',
  red: '#ef4444',
  purple: '#8b5cf6',
  blue: '#3b82f6',
  gray: '#4b5563',
  bgDark: '#0a0a0a',
  bgTransp: 'rgba(0, 209, 91, 0.2)',
};

export function getRankingChartData(filteredData: ParsedDataRow[], topN: number): ChartData<'bar'> {
  const counts: Record<string, number> = {};
  filteredData.forEach(d => { counts[d.peca] = (counts[d.peca] || 0) + d.quantidade; });
  
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);

  return {
    labels: sorted.map(item => item[0]),
    datasets: [{
      label: 'Volume de Falhas',
      data: sorted.map(item => item[1]),
      backgroundColor: COLORS.primary,
      borderRadius: 4,
    }]
  };
}

export function getOriginDoughnutData(filteredData: ParsedDataRow[]): ChartData<'doughnut'> {
  const counts: Record<string, number> = {};
  filteredData.forEach(d => { counts[d.origem] = (counts[d.origem] || 0) + d.quantidade; });
  
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return {
    labels: sorted.map(item => item[0]),
    datasets: [{
      data: sorted.map(item => item[1]),
      backgroundColor: [COLORS.primary, COLORS.purple, COLORS.orange, COLORS.blue, COLORS.red],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };
}



export function getTrendChartData(filteredData: ParsedDataRow[]): ChartData<'line'> {
  // Simplificado temporal com todos os meses disponíveis passados 
  const counts: Record<string, number> = {};
  const monthsOrder = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
  
  filteredData.forEach(d => {
    if (d.mes && d.mes !== 'GERAL') {
      counts[d.mes] = (counts[d.mes] || 0) + d.quantidade;
    }
  });

  const availableMonths = Object.keys(counts).sort((a, b) => monthsOrder.indexOf(a) - monthsOrder.indexOf(b));

  return {
    labels: availableMonths.map(m => m.substring(0, 3)),
    datasets: [{
      label: 'Tendência de Falhas',
      data: availableMonths.map(m => counts[m]),
      borderColor: COLORS.primary,
      backgroundColor: COLORS.bgTransp,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: COLORS.primaryDark,
    }]
  };
}
