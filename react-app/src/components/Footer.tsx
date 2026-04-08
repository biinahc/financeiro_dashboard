import { Code2 } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="mt-10 pt-10 pb-6 border-t border-gray-800 flex flex-col items-center justify-center text-gray-500 text-sm">
      <div className="flex flex-col items-center gap-3 mb-4">
        {/* Usando div mockada pra logo do footer */}
        <div className="w-40 h-10 bg-gray-800 rounded opacity-30 cursor-pointer hover:opacity-100 transition duration-300 border border-gray-700 flex items-center justify-center text-xs text-gray-500">
           Mottu Logo Branca
        </div>
        <span className="text-center">&copy; {currentYear} Qualidade Mottu</span>
      </div>
      <div className="flex items-center">
        <Code2 className="text-primary mr-2 h-4 w-4" /> Desenvolvido por
        <span className="font-bold text-gray-200 ml-1">Sabrina Caldas</span>
      </div>
    </footer>
  );
}
