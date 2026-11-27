import React, { useState, useEffect } from 'react';
import { Download, Copy, Check, X, FileText, Table, ExternalLink } from 'lucide-react';
import type { CSVExportEventDetail } from '../../services/db';

export const CSVExportModal: React.FC = () => {
  const [exportData, setExportData] = useState<CSVExportEventDetail | null>(null);
  const [copied, setCopied] = useState(false);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    const handleExportEvent = (e: Event) => {
      const customEvt = e as CustomEvent<CSVExportEventDetail>;
      if (customEvt.detail) {
        setExportData(customEvt.detail);
        setCopied(false);
        setShowTable(false);
      }
    };

    window.addEventListener('csk-csv-downloaded', handleExportEvent);
    return () => window.removeEventListener('csk-csv-downloaded', handleExportEvent);
  }, []);

  if (!exportData) return null;

  const handleCopyClipboard = async () => {
    try {
      await navigator.clipboard.writeText(exportData.csvContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback textarea copy
      const ta = document.createElement('textarea');
      ta.value = exportData.csvContent;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleManualDownload = () => {
    try {
      const blob = new Blob([exportData.csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = exportData.filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-100 my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">CSV Export Ready</h3>
              <p className="text-xs text-slate-500 font-mono truncate max-w-[220px] sm:max-w-xs">{exportData.filename}</p>
            </div>
          </div>
          <button
            onClick={() => setExportData(null)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 mt-3 overflow-y-auto pr-1 flex-1">
          {/* Status banner */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold">Export Successfully Processed ({exportData.totalRows} records)</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Sent to device storage / share sheet. You can also copy all data or preview below.
              </p>
            </div>
          </div>

          {/* Quick Action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={handleCopyClipboard}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
              }`}
            >
              {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-slate-600" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy CSV to Clipboard'}</span>
            </button>

            <button
              onClick={handleManualDownload}
              className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download File Again</span>
            </button>
          </div>

          {/* Table Preview Toggle */}
          <div className="pt-2">
            <button
              onClick={() => setShowTable(v => !v)}
              className="text-xs font-bold text-slate-700 hover:text-blue-700 flex items-center gap-1.5 cursor-pointer pb-2"
            >
              <Table className="w-4 h-4 text-slate-500" />
              <span>{showTable ? 'Hide Data Preview' : 'Show Data Preview (First 5 Rows)'}</span>
            </button>

            {showTable && (
              <div className="border border-slate-200 rounded-2xl overflow-x-auto max-h-56">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                    <tr>
                      {exportData.headers.map((h, i) => (
                        <th key={i} className="p-2 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {(exportData.rows || []).slice(0, 5).map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-2 whitespace-nowrap text-slate-600">
                            {String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            onClick={() => setExportData(null)}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
