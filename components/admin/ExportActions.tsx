import { Download, Printer, FileSpreadsheet } from "lucide-react";

export interface ExportActionsProps {
  onDownloadAll?: () => void;
  onGeneratePDF?: () => void;
  isGeneratingPDF?: boolean;
}

export function ExportActions({
  onDownloadAll,
  onGeneratePDF,
  isGeneratingPDF,
}: ExportActionsProps) {
  return (
    <div data-html2canvas-ignore="true" className="flex flex-wrap items-center gap-2 mb-4 print:hidden">
      {onDownloadAll && (
        <button
          onClick={onDownloadAll}
          className="flex items-center justify-center gap-1.5 bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 hover:text-blue-700 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm"
          title="ดาวน์โหลดไฟล์ CSV ทั้งหมด"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">ดาวน์โหลดทั้งหมด</span>
          <span className="sm:hidden">ทั้งหมด</span>
        </button>
      )}
      
      <button
        onClick={() => window.print()}
        className="flex items-center justify-center gap-1.5 bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm"
        title="พิมพ์รายงานหน้านี้"
      >
        <Printer className="w-4 h-4" />
        <span className="hidden sm:inline">พิมพ์รายงาน</span>
        <span className="sm:hidden">พิมพ์</span>
      </button>

      {onGeneratePDF && (
        <button
          onClick={onGeneratePDF}
          disabled={isGeneratingPDF}
          className="flex items-center justify-center gap-1.5 bg-white border border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-700 hover:text-red-700 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm disabled:opacity-50"
          title="ดาวน์โหลดรายงานเป็น PDF"
        >
          {isGeneratingPDF ? (
            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <FileSpreadsheet className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Export PDF</span>
          <span className="sm:hidden">PDF</span>
        </button>
      )}
    </div>
  );
}
