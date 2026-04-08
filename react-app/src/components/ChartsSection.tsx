import { HelpCircle } from 'lucide-react';
import { Bar, Doughnut, Line, Chart } from 'react-chartjs-2';
import type { ChartData } from 'chart.js';

interface ChartsSectionProps {
  rankingData: ChartData<'bar'> | null;
  originData: ChartData<'doughnut'> | null;
  paretoData: ChartData<'bar' | 'line'> | null;
  trendData: ChartData<'line'> | null;
}

const COMMON_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: '#888' }
    }
  },
  scales: {
    x: { ticks: { color: '#888' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
    y: { ticks: { color: '#888' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } }
  }
};

const DOUGHNUT_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'right' as const, labels: { color: '#888' } }
  },
  cutout: '70%'
};

const PARETO_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#888' } } },
  scales: {
    x: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.05)' } },
    y: {
      type: 'linear' as const,
      display: true,
      position: 'left' as const,
      ticks: { color: '#888' },
      grid: { color: 'rgba(255,255,255,0.05)' }
    },
    y1: {
      type: 'linear' as const,
      display: true,
      position: 'right' as const,
      grid: { drawOnChartArea: false },
      ticks: { color: '#f97316', callback: (val: string | number) => val + '%' },
      min: 0,
      max: 100
    }
  }
};

export function ChartsSection({ rankingData, originData, paretoData, trendData }: ChartsSectionProps) {
  return (
    <>
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-200 flex items-center">
            Ranking de Defeitos por Peça
            <div className="tooltip ml-2">
              <HelpCircle className="h-4 w-4 text-gray-500" />
              <span className="tooltiptext">Maiores defeitos</span>
            </div>
          </h3>
          <div className="relative h-72 w-full">
            {rankingData && rankingData.labels && rankingData.labels.length > 0 ? (
              <Bar data={rankingData} options={COMMON_OPTIONS} />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">Sem dados suficientes.</div>
            )}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-200 flex items-center">
            Distribuição por Origem
            <div className="tooltip ml-2">
              <HelpCircle className="h-4 w-4 text-gray-500" />
              <span className="tooltiptext">Setores com maior índice de defeitos.</span>
            </div>
          </h3>
          <div className="relative h-72 w-full">
             {originData && originData.labels && originData.labels.length > 0 ? (
              <Doughnut data={originData} options={DOUGHNUT_OPTIONS} />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">Sem dados suficientes.</div>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 mb-6">
        <div className="glass-panel p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-200 flex items-center">
            Análise de Causa Raiz (Pareto)
            <div className="tooltip ml-2">
              <HelpCircle className="h-4 w-4 text-gray-500" />
              <span className="tooltiptext">Exibe os defeitos com maior volumetria, indicando a prioridade...</span>
            </div>
          </h3>
          <div className="relative h-72 w-full">
            {paretoData && paretoData.labels && paretoData.labels.length > 0 ? (
              <Chart type="bar" data={paretoData} options={PARETO_OPTIONS} />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">Sem dados suficientes.</div>
            )}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-200 flex items-center">
            Tendência Temporal Mensal
            <div className="tooltip ml-2">
              <HelpCircle className="h-4 w-4 text-gray-500" />
              <span className="tooltiptext">Evolução de falhas ao longo do tempo.</span>
            </div>
          </h3>
          <div className="relative h-72 w-full">
             {trendData && trendData.labels && trendData.labels.length > 0 ? (
              <Line data={trendData} options={COMMON_OPTIONS} />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">Sem dados suficientes.</div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
