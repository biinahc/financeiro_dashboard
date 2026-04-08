import { FileSpreadsheet } from 'lucide-react';

interface SpreadsheetTitleCardProps {
  fileName: string | null;
}

export function SpreadsheetTitleCard({ fileName }: SpreadsheetTitleCardProps) {
  if (!fileName) return null;

  return (
    <div id="spreadsheetTitleContainer">
      <div className="glass-panel p-4 rounded-xl border border-primary/30 flex items-center gap-3">
        <FileSpreadsheet className="text-primary h-6 w-6" />
        <div>
          <p className="text-[10px] text-primary uppercase font-bold tracking-wider">Planilha em Processamento</p>
          <h2 className="text-white font-semibold">{fileName}</h2>
        </div>
      </div>
    </div>
  );
}
