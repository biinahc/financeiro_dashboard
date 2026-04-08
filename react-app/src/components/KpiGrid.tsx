import type { ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';

interface VariationData {
  text: string;
  isGood: boolean;
}

interface KpiMetric {
  value: string | number;
  label: string;
  tooltip: string;
  icon: ReactNode;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  variation?: VariationData | null;
  isHidden?: boolean;
}

interface KpiGridProps {
  metrics: KpiMetric[];
}

export function KpiGrid({ metrics }: KpiGridProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.filter(m => !m.isHidden).map((metric, idx) => (
        <div
          key={idx}
          className={`glass-panel p-6 rounded-2xl border-l-4 ${metric.borderClass} hover:scale-[1.02] transition-transform text-center md:text-left shadow-lg overflow-hidden`}
        >
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="overflow-hidden">
              <div className="text-sm text-secondary font-medium flex items-center">
                {metric.label}
                <div className="tooltip ml-2">
                  <HelpCircle className="h-3 w-3 text-gray-500" />
                  <span className="tooltiptext">{metric.tooltip}</span>
                </div>
              </div>
              <h3 className="text-3xl font-bold text-white mt-1 truncate" title={String(metric.value)}>
                {metric.value}
              </h3>
              
              <div className="mt-1 min-h-[20px]">
                {metric.variation && (
                  <>
                    <span className={`font-bold text-xs ${metric.variation.isGood ? 'text-green-400' : 'text-red-400'}`}>
                      {metric.variation.text}
                    </span>
                    <span className="text-gray-500 text-[10px] ml-1">vs ant.</span>
                  </>
                )}
                {metric.variation === null && (
                  <span className="text-gray-500 text-xs">- sem base</span>
                )}
              </div>
            </div>
            
            <div className={`p-3 rounded-xl ${metric.bgClass} ${metric.colorClass} flex-shrink-0`}>
              {metric.icon}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
