import { HelpCircle, Search, EyeOff } from 'lucide-react';
import type { ParsedDataRow } from '../types/dashboard';

interface DataTableProps {
  data: ParsedDataRow[];
  searchTerm: string;
  onSearchChange: (s: string) => void;
  onIgnoreItem: (codigo: string, defeito: string, peca: string) => void;
}

export function DataTable({ data, searchTerm, onSearchChange, onIgnoreItem }: DataTableProps) {
  return (
    <section className="glass-panel rounded-2xl shadow-lg overflow-hidden flex flex-col">
      <div className="p-6 border-b border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h3 className="text-lg font-semibold text-gray-200 flex items-center">
          Detalhamento de Ocorrências
          <div className="tooltip ml-2">
            <HelpCircle className="h-4 w-4 text-gray-500" />
            <span className="tooltiptext">Lista completa de dados. Use a busca para filtrar...</span>
          </div>
        </h3>
        
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar peça ou defeito..."
            className="w-full bg-cardBg border border-gray-600 text-white rounded-lg pl-10 pr-4 py-2 focus:ring-primary focus:border-primary outline-none"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs text-gray-400 uppercase bg-gray-800/50 block w-full">
            <tr className="flex w-full">
              <th scope="col" className="px-6 py-3 w-[15%]">Código</th>
              <th scope="col" className="px-6 py-3 w-[30%]">Nome da Peça</th>
              <th scope="col" className="px-6 py-3 w-[20%]">Defeito / Problema</th>
              <th scope="col" className="px-6 py-3 w-[10%]">Origem</th>
              <th scope="col" className="px-6 py-3 w-[10%] text-right">Qtd</th>
              <th scope="col" className="px-6 py-3 w-[10%]">Mês</th>
              <th scope="col" className="px-6 py-3 w-[5%] text-center">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50 block w-full h-[500px] overflow-y-auto scrollbar-hide">
             {data.length === 0 ? (
                 <tr className="flex w-full">
                  <td className="px-6 py-8 text-center text-gray-500 w-full">
                    Importe uma planilha para visualizar os dados.
                  </td>
                </tr>
             ) : (
                data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-700/30 transition flex w-full">
                    <td className="px-6 py-4 whitespace-nowrap text-cyan-400 font-medium w-[15%] truncate">{row.codigo}</td>
                    <td className="px-6 py-4 font-medium text-gray-100 w-[30%] truncate">{row.peca}</td>
                    <td className="px-6 py-4 text-orange-300 w-[20%] truncate" title={row.defeito}>{row.defeito}</td>
                    <td className="px-6 py-4 w-[10%]">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-slate-800 text-gray-300 border border-slate-600 truncate">
                            {row.origem}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-200 w-[10%]">{row.quantidade}</td>
                    <td className="px-6 py-4 text-gray-400 w-[10%]">{row.mes}</td>
                    <td className="px-6 py-4 text-center w-[5%] flex justify-center items-center">
                        <button 
                            onClick={() => onIgnoreItem(row.codigo, row.defeito, row.peca)} 
                            className="text-gray-400 hover:text-red-400 transition" 
                            title="Ocultar Item"
                        >
                            <EyeOff className="h-4 w-4" />
                        </button>
                    </td>
                  </tr>
                ))
             )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
