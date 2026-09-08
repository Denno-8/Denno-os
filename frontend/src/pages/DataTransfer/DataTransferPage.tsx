import { useState } from "react";
import { Download, Upload, FileJson, FileSpreadsheet, FileText, CheckCircle2, AlertCircle, File } from "lucide-react";
import { dataTransferService, type ImportResult } from "../../services/dataTransfer.service";

const USER_RESOURCES = ["applications", "notes", "goals", "recruiters", "cv", "interviews", "emails"];
const PUBLIC_RESOURCES = ["companies", "jobs"];

export default function DataTransferPage() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [importResource, setImportResource] = useState(USER_RESOURCES[0]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const download = async (resource: string, format: "json" | "csv" | "excel" | "pdf") => {
    setDownloading(`${resource}-${format}`);
    try {
      await dataTransferService.downloadExport(resource, format);
    } catch {
      setImportError(`Couldn't export ${resource}.`);
    } finally {
      setDownloading(null);
    }
  };

  const handleFile = async (file: File) => {
    setImporting(true);
    setImportError(null);
    setImportResult(null);
    try {
      const result = await dataTransferService.importFile(importResource, file);
      setImportResult(result);
    } catch {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const fmt = ext === "xlsx" || ext === "xls" ? "Excel" : ext === "pdf" ? "PDF" : "CSV";
      setImportError(`Import failed — check that the file is a valid ${fmt} and you're signed in.`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-2 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Export / Import Data Center</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Export complete records to JSON / CSV / Excel / PDF or bulk import from CSV, Excel, or PDF</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Download size={18} className="text-blue-500" />
          <span>Export Resources</span>
        </h3>
        <div className="flex flex-col gap-2.5">
          {[...USER_RESOURCES, ...PUBLIC_RESOURCES].map((resource) => (
            <div key={resource} className="flex items-center justify-between border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/50 dark:hover:bg-slate-800/80 transition-colors">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 capitalize">{resource}</span>
              <div className="flex gap-2 flex-wrap justify-end">
                <button
                  disabled={downloading === `${resource}-json`}
                  onClick={() => download(resource, "json")}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl px-3 py-1.5 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <FileJson size={14} className="text-amber-500" />
                  <span>{downloading === `${resource}-json` ? "Exporting…" : "JSON"}</span>
                </button>
                <button
                  disabled={downloading === `${resource}-csv`}
                  onClick={() => download(resource, "csv")}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl px-3 py-1.5 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <FileSpreadsheet size={14} className="text-emerald-500" />
                  <span>{downloading === `${resource}-csv` ? "Exporting…" : "CSV"}</span>
                </button>
                <button
                  disabled={downloading === `${resource}-excel`}
                  onClick={() => download(resource, "excel")}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl px-3 py-1.5 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <File size={14} className="text-green-600 dark:text-green-400" />
                  <span className="text-green-700 dark:text-green-400">{downloading === `${resource}-excel` ? "Exporting…" : "Excel"}</span>
                </button>
                <button
                  disabled={downloading === `${resource}-pdf`}
                  onClick={() => download(resource, "pdf")}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-rose-300 dark:border-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl px-3 py-1.5 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <FileText size={14} className="text-rose-500" />
                  <span className="text-rose-600 dark:text-rose-400">{downloading === `${resource}-pdf` ? "Exporting…" : "PDF"}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Upload size={18} className="text-blue-500" />
          <span>Import Data</span>
        </h3>
        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Resource</label>
            <select
              value={importResource}
              onChange={(e) => setImportResource(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none font-medium capitalize"
            >
              {[...USER_RESOURCES, ...PUBLIC_RESOURCES].map((r) => (
                <option key={r} value={r} className="capitalize">{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Upload File <span className="font-normal text-slate-400">(CSV, Excel .xlsx, or PDF)</span></label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.pdf"
              disabled={importing}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-600 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50 cursor-pointer"
            />
          </div>

          {importing && <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Validating & importing records…</div>}
          {importError && (
            <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-xl border border-rose-200 dark:border-rose-900/40">
              <AlertCircle size={15} className="shrink-0" />
              <span>{importError}</span>
            </div>
          )}
          {importResult && (
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 text-xs border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span>Imported {importResult.imported} of {importResult.imported + importResult.failed} rows</span>
              </div>
              {importResult.errors.length > 0 && (
                <ul className="text-rose-600 dark:text-rose-400 list-disc list-inside space-y-1 pt-1 font-mono">
                  {importResult.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                  {importResult.errors.length > 5 && <li>…and {importResult.errors.length - 5} more</li>}
                </ul>
              )}
            </div>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <strong>Supported formats:</strong>{" "}
            <span className="font-medium text-amber-600 dark:text-amber-400">CSV</span> — comma-separated, UTF-8.{" "}
            <span className="font-medium text-green-600 dark:text-green-400">Excel (.xlsx)</span> — first sheet used, first row = headers.{" "}
            <span className="font-medium text-rose-600 dark:text-rose-400">PDF</span> — must contain a table; best used with PDFs exported from this app.{" "}
            Array fields (skills, tags) should be comma-separated inside a single cell (e.g.{" "}
            <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">"Python,AWS,Docker"</code>).
          </p>
        </div>
      </div>
    </div>
  );
}
