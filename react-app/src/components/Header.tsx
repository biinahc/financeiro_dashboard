import { FileDown, Upload } from 'lucide-react';

interface HeaderProps {
  onExportPDF: () => void;
  onFileUpload: (file: File) => void;
  showExportButton: boolean;
}

export function Header({ onExportPDF, onFileUpload, showExportButton }: HeaderProps) {
  return (
    <header className="flex flex-col md:flex-row justify-between items-center glass-panel p-6 rounded-2xl shadow-lg border-b-2 border-primary">
      <div className="flex items-center gap-4">
        {/* Placeholder para a logo original */}
        <div className="h-12 w-24 bg-gray-800 rounded-lg hidden md:flex items-center justify-center border border-gray-700 text-xs text-gray-500">
          Logo
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center">
            Dashboard da Qualidade
          </h1>
          <p className="text-secondary mt-1 text-sm font-medium">Análise de Importados e Retrabalho</p>
          <p className="text-secondary mt-1 text-[10px] font-medium">Controle Anderson Eduardo</p>
        </div>
      </div>

      <div className="mt-4 md:mt-0 flex items-center gap-4">
        {showExportButton && (
          <button
            onClick={onExportPDF}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white rounded-lg cursor-pointer transition flex items-center shadow-lg shadow-black"
          >
            <FileDown className="text-red-400 mr-2 h-5 w-5" /> Gerar Report
          </button>
        )}
        <label className="px-4 py-2 bg-primary hover:bg-green-600 text-black font-semibold rounded-lg cursor-pointer transition flex items-center shadow-lg shadow-green-500/20">
          <Upload className="h-5 w-5 mr-2" /> <span>Carregar Dados</span>
          <input
            type="file"
            className="hidden"
            accept=".xlsx, .xls, .csv, .xlsm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onFileUpload(file);
                e.target.value = ''; // reseta pro onchange disparar dinovo com mesmo arquivo se precisar
              }
            }}
          />
        </label>
      </div>
    </header>
  );
}
