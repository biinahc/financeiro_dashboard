import { useState, useMemo, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { Header } from './components/Header';
import { SpreadsheetTitleCard } from './components/SpreadsheetTitleCard';
import { FilterPanel } from './components/FilterPanel';
import { KpiGrid } from './components/KpiGrid';
import { ChartsSection } from './components/ChartsSection';
import { DataTable } from './components/DataTable';
import { Footer } from './components/Footer';

import { useExcelLoader } from './hooks/useExcelLoader';
import { applyDataFilters } from './utils/dataFilters';
import { extractMetrics } from './utils/metricsAggregator';
import { getRankingChartData, getOriginDoughnutData, getTrendChartData } from './utils/chartDataFormatters';
import type { FilterState } from './types/dashboard';

// Icons
import { Wrench, CheckCircle, Trash2, TriangleAlert, Truck, HandCoins } from 'lucide-react';

function App() {
  const { loadFile, rawData, isImportadosFile, availableOrigins, availableMonths, isLoading } = useExcelLoader();
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Estados
  const [fileName, setFileName] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  
  const [filterState, setFilterState] = useState<FilterState>({
    month: 'ALL',
    startDate: '',
    endDate: '',
    topN: 10,
    origins: [],
    ignoredItems: new Set<string>()
  });

  // Atualizar origens selecionadas quando uma nova planilha é lida e tem origens novas
  useEffect(() => {
    if (availableOrigins.length > 0) {
      setFilterState(prev => ({ ...prev, origins: availableOrigins }));
    }
  }, [availableOrigins]);

  // Derivações com useMemo
  const filteredData = useMemo(() => {
    return applyDataFilters(rawData, filterState);
  }, [rawData, filterState]);

  // Derivar tabela considerando apenas o searchTerm adicional (sem mutar kpis)
  const tableData = useMemo(() => {
    if (!searchTerm) return filteredData;
    const lowerSearch = searchTerm.toLowerCase();
    return filteredData.filter(d => 
      d.peca.toLowerCase().includes(lowerSearch) || 
      d.defeito.toLowerCase().includes(lowerSearch)
    );
  }, [filteredData, searchTerm]);

  // Pegar mês anterior caso mês estático esteja selecionado
  const prevMonthData = useMemo(() => {
    if (filterState.month === 'ALL' || filterState.month === 'WEEK') return [];
    
    // Simplificação de mes anterior
    const monthsOrder = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
    const idx = monthsOrder.indexOf(filterState.month);
    if (idx > 0) {
      const prevM = monthsOrder[idx - 1];
      const prevFilter: FilterState = { ...filterState, month: prevM };
      return applyDataFilters(rawData, prevFilter);
    }
    return [];
  }, [rawData, filterState]);

  // Calcular KPIs centrais
  const metricsData = useMemo(() => {
    return extractMetrics(filteredData, prevMonthData, isImportadosFile);
  }, [filteredData, prevMonthData, isImportadosFile]);

  // Formatar Array pro KpiGrid Component
  const kpis = useMemo(() => {
    const arr = [
      {
        label: 'Total',
        value: metricsData.total.toLocaleString(),
        tooltip: 'Quantidade de peças no período selecionado.',
        icon: <Wrench className="h-6 w-6" />,
        bgClass: 'bg-blue-500/20',
        colorClass: 'text-blue-400',
        borderClass: 'border-blue-500',
        variation: metricsData.varTotal
      },
      {
        label: '% Aproveitamento',
        value: `${metricsData.recoveryPercentage}%`,
        tooltip: 'Proporção de peças aprovadas.',
        icon: <CheckCircle className="h-6 w-6" />,
        bgClass: 'bg-green-500/20',
        colorClass: 'text-green-400',
        borderClass: 'border-green-500',
        variation: metricsData.varRecovery
      },
      {
        label: 'Principal Defeito',
        value: metricsData.mainDefect,
        tooltip: `Total de ${metricsData.maxCount} peças.`,
        icon: <TriangleAlert className="h-6 w-6" />,
        bgClass: 'bg-orange-500/20',
        colorClass: 'text-orange-400',
        borderClass: 'border-orange-500',
        variation: metricsData.varMainDefect
      }
    ];

    if (!isImportadosFile) {
        arr.splice(2, 0, {
            label: 'Retorno',
            value: metricsData.totalReturned.toLocaleString(),
            tooltip: 'Peças descartadas.',
            icon: <Trash2 className="h-6 w-6" />,
            bgClass: 'bg-red-500/20',
            colorClass: 'text-red-500',
            borderClass: 'border-red-500',
            variation: metricsData.varReturned
        });
        arr.push({
            label: 'Recuperação R$',
            value: `R$ ${metricsData.totalRecoveredValue.toLocaleString()}`,
            tooltip: 'Lucro de peças salvas do sucateamento.',
            icon: <HandCoins className="h-6 w-6" />,
            bgClass: 'bg-emerald-500/20',
            colorClass: 'text-emerald-400',
            borderClass: 'border-emerald-500',
            variation: null
        });
    } else {
        arr.splice(2, 0, {
            label: 'Em Trânsito',
            value: metricsData.transit.toLocaleString(),
            tooltip: 'Quantidade de linhas de peças a caminho.',
            icon: <Truck className="h-6 w-6" />,
            bgClass: 'bg-purple-500/20',
            colorClass: 'text-purple-400',
            borderClass: 'border-purple-500',
            variation: metricsData.varTransit
        });
    }
    
    return arr;
  }, [metricsData, isImportadosFile]);

  // Transformar Dados para os Gráficos isoladamente para não sobrecarregar
  const rankingData = useMemo(() => getRankingChartData(filteredData, filterState.topN), [filteredData, filterState.topN]);
  const originData = useMemo(() => getOriginDoughnutData(filteredData), [filteredData]);
  const trendData = useMemo(() => getTrendChartData(filteredData), [filteredData]);

  // Handlers
  const handleFileUpload = (file: File) => {
    setFileName(file.name);
    loadFile(file);
  };

  const handleOriginToggle = (origin: string) => {
    setFilterState(prev => {
      const newOrigins = prev.origins.includes(origin) 
        ? prev.origins.filter(o => o !== origin)
        : [...prev.origins, origin];
      return { ...prev, origins: newOrigins };
    });
  };

  const handleIgnoreItem = (codigo: string, defeito: string) => {
    const key = `${codigo}:::${defeito}`;
    setFilterState(prev => {
      const next = new Set(prev.ignoredItems);
      next.add(key);
      return { ...prev, ignoredItems: next };
    });
  };

  const handleRestoreItem = (key: string) => {
    setFilterState(prev => {
      const next = new Set(prev.ignoredItems);
      next.delete(key);
      return { ...prev, ignoredItems: next };
    });
  };

  const handleExportPDF = () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);

    setTimeout(() => {
      const opt = {
        margin: 10,
        filename: `Dashboard_Qualidade_${fileName ? fileName.replace('.xlsx', '') : 'Relatorio'}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          onclone: (clonedDoc: HTMLDocument) => {
            // Fix html2canvas oklch error by forcing a fallback style
            const style = clonedDoc.createElement('style');
            style.textContent = `
              * {
                color-interpolation-filters: sRGB !important;
              }
              /* Force fallback for any oklch usage to avoid html2canvas crash */
              :root {
                --color-primary: #00D15B !important;
                --color-gray-50: #f9fafb !important;
                --color-gray-100: #f3f4f6 !important;
                --color-gray-200: #e5e7eb !important;
                --color-gray-300: #d1d5db !important;
                --color-gray-400: #9ca3af !important;
                --color-gray-500: #6b7280 !important;
                --color-gray-600: #4b5563 !important;
                --color-gray-700: #374151 !important;
                --color-gray-800: #1f2937 !important;
                --color-gray-900: #111827 !important;
              }
            `;
            clonedDoc.head.appendChild(style);
          }
        },
        jsPDF: { unit: 'mm' as const, format: 'a3', orientation: 'landscape' as const }
      };

      html2pdf()
        .set(opt)
        .from(dashboardRef.current!)
        .save()
        .then(() => {
          setIsExporting(false);
        });
    }, 300); // tempo pro react re-renderizar tabela sem overflow
  };

  const ignoredList = Array.from(filterState.ignoredItems).map(key => {
    const parts = key.split(':::');
    return { key, label: `${parts[0]} - ${parts[1]}` };
  });

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6" id="dashboardContent" ref={dashboardRef}>
        
        <Header 
          showExportButton={!!fileName}
          onFileUpload={handleFileUpload}
          onExportPDF={handleExportPDF}
        />

        {isLoading && (
           <div className="glass-panel p-4 rounded-xl text-center text-primary font-semibold animate-pulse">
             Processando regras de negócio e lendo planilha...
           </div>
        )}

        <SpreadsheetTitleCard fileName={fileName} />

        <FilterPanel 
          months={availableMonths}
          selectedMonth={filterState.month}
          onMonthChange={(m) => setFilterState(p => ({ ...p, month: m }))}
          showWeekFilter={filterState.month === 'WEEK'}
          startDate={filterState.startDate || ''}
          endDate={filterState.endDate || ''}
          onStartDateChange={(sd) => setFilterState(p => ({ ...p, startDate: sd }))}
          onEndDateChange={(ed) => setFilterState(p => ({ ...p, endDate: ed }))}
          topN={filterState.topN}
          onTopNChange={(n) => setFilterState(p => ({ ...p, topN: n }))}
          availableOrigins={availableOrigins}
          selectedOrigins={filterState.origins}
          onOriginToggle={handleOriginToggle}
          ignoredItems={ignoredList}
          onRestoreItem={handleRestoreItem}
        />

        <KpiGrid metrics={kpis} />

        <ChartsSection 
            rankingData={rankingData}
            originData={originData}
            trendData={trendData}
        />

        <DataTable 
          data={tableData} 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onIgnoreItem={handleIgnoreItem}
          isExporting={isExporting}
        />

        <Footer />
        
      </div>
    </div>
  );
}

export default App;
