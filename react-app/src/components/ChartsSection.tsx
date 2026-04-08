import { HelpCircle } from 'lucide-react';

export function ChartsSection() {
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
          <div className="relative h-72 flex items-center justify-center border border-dashed border-gray-600 rounded-lg bg-gray-800/30">
            <span className="text-secondary text-sm">Gráfico de Barras em breve</span>
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
          <div className="relative h-72 flex items-center justify-center border border-dashed border-gray-600 rounded-lg bg-gray-800/30">
            <span className="text-secondary text-sm">Gráfico Doughnut em breve</span>
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
          <div className="relative h-72 flex items-center justify-center border border-dashed border-gray-600 rounded-lg bg-gray-800/30">
            <span className="text-secondary text-sm">Gráfico Pareto em breve</span>
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
          <div className="relative h-72 flex items-center justify-center border border-dashed border-gray-600 rounded-lg bg-gray-800/30">
            <span className="text-secondary text-sm">Gráfico Linha em breve</span>
          </div>
        </div>
      </section>
    </>
  );
}
