import { API_URL, getAccessToken } from "./api";

function authHeader(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface ImportResult {
  resource: string;
  imported: number;
  failed: number;
  errors: string[];
}

export const dataTransferService = {
  /** Triggers a real browser download by fetching the file then saving it via an object URL. */
  async downloadExport(resource: string, format: "json" | "csv" | "excel" | "pdf"): Promise<void> {
    let res: Response;
    try {
      res = await fetch(`${API_URL}/export/${resource}?format=${format}`, { headers: authHeader() });
    } catch {
      throw new Error("Failed to connect to backend server. Make sure the API is running on http://localhost:8000.");
    }
    if (!res.ok) throw new Error(`Export failed: ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // excel format maps to .xlsx extension
    const ext = format === "excel" ? "xlsx" : format;
    a.download = `denno_${resource}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async importJSON(resource: string, records: unknown[]): Promise<ImportResult> {
    let res: Response;
    try {
      res = await fetch(`${API_URL}/import/${resource}/json`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ records }),
      });
    } catch {
      throw new Error("Failed to connect to backend server. Make sure the API is running on http://localhost:8000.");
    }
    if (!res.ok) throw new Error(`Import failed: ${res.status}`);
    return res.json();
  },

  async importCSV(resource: string, file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append("file", file);
    let res: Response;
    try {
      res = await fetch(`${API_URL}/import/${resource}/csv`, {
        method: "POST",
        headers: authHeader(), // NOTE: no Content-Type here — the browser sets the multipart boundary itself
        body: formData,
      });
    } catch {
      throw new Error("Failed to connect to backend server. Make sure the API is running on http://localhost:8000.");
    }
    if (!res.ok) throw new Error(`Import failed: ${res.status}`);
    return res.json();
  },

  async importExcel(resource: string, file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append("file", file);
    let res: Response;
    try {
      res = await fetch(`${API_URL}/import/${resource}/excel`, {
        method: "POST",
        headers: authHeader(),
        body: formData,
      });
    } catch {
      throw new Error("Failed to connect to backend server. Make sure the API is running on http://localhost:8000.");
    }
    if (!res.ok) throw new Error(`Import failed: ${res.status}`);
    return res.json();
  },

  async importPDF(resource: string, file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append("file", file);
    let res: Response;
    try {
      res = await fetch(`${API_URL}/import/${resource}/pdf`, {
        method: "POST",
        headers: authHeader(),
        body: formData,
      });
    } catch {
      throw new Error("Failed to connect to backend server. Make sure the API is running on http://localhost:8000.");
    }
    if (!res.ok) throw new Error(`Import failed: ${res.status}`);
    return res.json();
  },

  /** Auto-dispatches to the right import method based on the file extension. */
  async importFile(resource: string, file: File): Promise<ImportResult> {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "json") {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON file formatting.");
      }
      const records = Array.isArray(parsed)
        ? parsed
        : typeof parsed === "object" && parsed !== null && "records" in parsed && Array.isArray((parsed as any).records)
        ? (parsed as any).records
        : [];
      if (!records.length) throw new Error("JSON file contained no records array.");
      return this.importJSON(resource, records);
    }
    if (ext === "xlsx" || ext === "xls") return this.importExcel(resource, file);
    if (ext === "pdf") return this.importPDF(resource, file);
    return this.importCSV(resource, file); // default: csv / txt
  },
};
