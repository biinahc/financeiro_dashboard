import { EyeOff } from 'lucide-react';

interface FilterPanelProps {
  months: string[];
  selectedMonth: string;
  onMonthChange: (m: string) => void;
  showWeekFilter: boolean;
  startDate: string;
  endDate: string;
  onStartDateChange: (d: string) => void;
  onEndDateChange: (d: string) => void;
  topN: number;
  onTopNChange: (n: number) => void;
  availableOrigins: string[];
  selectedOrigins: string[];
  onOriginToggle: (origin: string) => void;
  ignoredItems: Array<{ key: string; label: string }>;
  onRestoreItem: (key: string) => void;
}

export function FilterPanel({
  months,
  selectedMonth,
  onMonthChange,
  showWeekFilter,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  topN,
  onTopNChange,
  availableOrigins,
  selectedOrigins,
  onOriginToggle,
  ignoredItems,
  onRestoreItem
}: FilterPanelProps) {
  return (
    <section className="glass-panel p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
      {/* Month Filter */}
      <div>
        <label className="block text-sm font-medium text-secondary mb-2">Período / Mês</label>
        <select
          value={selectedMonth}
          onChange={(e) => onMonthChange(e.target.value)}
          className="w-full bg-cardBg border border-gray-600 text-white rounded-lg p-2.5 focus:ring-primary focus:border-primary outline-none"
        >
          <option value="ALL">Todos os Meses</option>
          {months.map(m => (
            <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1).toLowerCase()}</option>
          ))}
          <option value="WEEK">Por Semana / Período</option>
        </select>
      </div>

      {/* Week Filter */}
      <div className={`md:col-span-2 flex items-end gap-4 w-full ${!showWeekFilter ? 'hidden' : ''}`}>
        <div className="flex-1">
          <label className="block text-sm font-medium text-secondary mb-2">Data Inicial</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full bg-cardBg border border-gray-600 text-white text-sm rounded-lg p-2.5 focus:ring-primary focus:border-primary outline-none h-[46px]"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-secondary mb-2">Data Final</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full bg-cardBg border border-gray-600 text-white text-sm rounded-lg p-2.5 focus:ring-primary focus:border-primary outline-none h-[46px]"
          />
        </div>
      </div>

      {/* Top N Slider */}
      <div>
        <label className="block text-sm font-medium text-secondary mb-2">Top Itens Críticos</label>
        <div className="flex items-center space-x-4 h-[46px]">
          <input
            type="range"
            min="5"
            max="20"
            step="5"
            value={topN}
            onChange={(e) => onTopNChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <span className="text-lg font-bold text-accent">{topN}</span>
        </div>
      </div>

      {/* Origin Checkboxes */}
      <div className="md:col-span-2 lg:col-span-4 mt-2 border-t border-gray-700/50 pt-4" style={{ gridColumn: '1 / -1' }}>
        <label className="block text-sm font-medium text-secondary mb-2">Origem do Defeito</label>
        <div className="flex flex-wrap gap-4">
          {availableOrigins.length === 0 && (
            <span className="text-secondary text-sm">Nenhuma origem encontrada.</span>
          )}
          {availableOrigins.map(origin => (
            <label key={origin} className="inline-flex items-center cursor-pointer mb-2 mr-4">
              <input
                type="checkbox"
                checked={selectedOrigins.includes(origin)}
                onChange={() => onOriginToggle(origin)}
                className="form-checkbox text-primary h-5 w-5 rounded border-gray-600 bg-cardBg focus:ring-primary accent-primary"
              />
              <span className="ml-2 text-gray-300 text-sm">{origin}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Ignored Items */}
      {ignoredItems.length > 0 && (
        <div className="md:col-span-2 lg:col-span-4 mt-2">
          <label className="block text-sm font-medium text-red-400 mb-2 flex items-center">
            <EyeOff className="h-4 w-4 mr-2" /> Itens Ocultados do Dashboard
          </label>
          <div className="flex flex-wrap gap-2">
            {ignoredItems.map(item => (
              <span
                key={item.key}
                onClick={() => onRestoreItem(item.key)}
                title="Clique para Restaurar"
                className="inline-flex items-center px-3 py-1 bg-red-900/30 border border-red-700 text-red-300 text-xs rounded-full group cursor-pointer hover:bg-red-800/50 transition"
              >
                {item.label.substring(0, 40)}{item.label.length > 40 ? '...' : ''}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
