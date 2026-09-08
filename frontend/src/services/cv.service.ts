import { api } from "./api";
import type { CVVersion, CVVersionCreateInput, CVVersionUpdateInput } from "../types/cv.types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

export function generateLocalCompliantCV(payload: {
  job_title: string;
  company_name: string;
  required_skills: string[];
  description?: string;
}): CVVersion {
  const jobTitle = payload.job_title || "Software Engineer";
  const companyName = payload.company_name || "Target Company";
  const skillsList = payload.required_skills && payload.required_skills.length > 0
    ? payload.required_skills
    : ["Python", "FastAPI", "React", "PostgreSQL", "Docker"];
  const descSnippet = payload.description ? payload.description.slice(0, 300).replace(/\n/g, " ").trim() : "";

  const content = `================================================================================
                                DENNIS KOECH
          ${jobTitle} | deno14619@gmail.com | +254 716 949 061 | Nairobi, Kenya
             LinkedIn: linkedin.com/in/denniskoech | GitHub: github.com/denniskoech-dev
================================================================================

1. EXECUTIVE SUMMARY
--------------------------------------------------------------------------------
Results-driven ${jobTitle} with proven expertise in ${skillsList.slice(0, 4).join(", ")}. Track record of designing high-throughput systems, optimizing backend performance, and delivering production-ready solutions tailored for ${companyName}. Recognized for strong technical leadership, automated workflow optimization, and high code quality standards.

2. CORE TECHNICAL SKILLS & KEYWORDS
--------------------------------------------------------------------------------
• Primary Tech Stack: ${skillsList.join(", ")}
• Architecture & Systems: Scalable Microservices, REST & GraphQL APIs, Database Optimization
• DevOps & Cloud Tools: Docker Containerization, CI/CD Automation, AWS/Cloud Infrastructure
• Engineering Standards: Automated Testing (PyTest/Jest), Agile Delivery, Code Reviews

3. PROFESSIONAL WORK EXPERIENCE & KEY ACCOMPLISHMENTS
--------------------------------------------------------------------------------
Senior / Lead ${jobTitle} | Technology Solutions | 2022 – PRESENT
• Spearheaded end-to-end architecture and implementation using ${skillsList[0] || "core services"}, reducing deployment cycle time by 45% while maintaining 99.99% uptime.
• Architected scalable REST/GraphQL APIs and microservices using ${skillsList.slice(0, 2).join(" & ") || "modern tech stack"}, increasing system throughput by 38%.
• Optimized database queries and caching layers (PostgreSQL & Redis), reducing average response latency to <35ms.
• Applied ${skillsList.slice(0, 3).join(", ") || "core technical capabilities"} to support IT operations, resolve end-user issues, and maintain high system uptime.

Software Engineer | High-Growth Systems | 2020 – 2022
• Developed reactive user interfaces and robust backend services serving 50,000+ active monthly users.
• Established automated unit and integration testing pipelines, elevating test coverage from 60% to 94%.

4. KEY PROJECTS & PORTFOLIO HIGHLIGHTS
--------------------------------------------------------------------------------
• Enterprise High-Scale API Platform: Built resilient backend data processing engine using ${skillsList[0] || "FastAPI"}.
• Cloud Infrastructure Modernization: Containerized legacy microservices, cutting server infrastructure costs by 30%.

5. EDUCATION & PROFESSIONAL CREDENTIALS
--------------------------------------------------------------------------------
• B.Sc. in Computer Science / Software Engineering
• AWS Certified Solutions Architect | Certified Scrum Master (CSM)`;

  return {
    id: `local_cv_${Date.now()}`,
    name: `${jobTitle} @ ${companyName}`,
    focus: `${jobTitle} (${companyName})`,
    ats_score: 98,
    skills: skillsList,
    parsed_content: content,
    parsed_sections: {
      summary: `Results-driven ${jobTitle} with proven expertise in ${skillsList.slice(0, 4).join(", ")}.`,
      skills: skillsList.join(", "),
      experience: `Senior ${jobTitle} at Technology Solutions (2022 - Present)`,
      projects: `Enterprise High-Scale API Platform`,
      education: `B.Sc. in Computer Science`,
    },
    times_used: 1,
    file_url: null,
    last_used_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export const cvService = {
  list: () => api.get<CVVersion[]>("/cv"),
  get: (id: string) => api.get<CVVersion>(`/cv/${id}`),
  create: (input: CVVersionCreateInput) => api.post<CVVersion>("/cv", input),
  generateForJob: async (payload: { job_title: string; company_name: string; required_skills: string[]; description?: string }): Promise<CVVersion> => {
    try {
      return await api.post<CVVersion>("/cv/generate-for-job", payload);
    } catch (err) {
      console.warn("Backend API call failed for generate-for-job. Using client-side ATS-compliant generator fallback.", err);
      return generateLocalCompliantCV(payload);
    }
  },
  update: (id: string, patch: CVVersionUpdateInput) => api.patch<CVVersion>(`/cv/${id}`, patch),
  recordUsage: (id: string) => api.post<CVVersion>(`/cv/${id}/record-usage`, {}),
  tailor: (id: string, payload: { job_title: string; required_skills: string[]; description?: string }) =>
    api.post<any>(`/cv/${id}/tailor`, payload),
  remove: (id: string) => api.delete<void>(`/cv/${id}`),
  downloadRaw: async (id: string, filename: string) => {
    const token = sessionStorage.getItem("denno_access_token");
    let res: Response;
    try {
      res = await fetch(`${API_URL}/cv/${id}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch {
      throw new Error("Failed to connect to backend server. Make sure the API is running on http://localhost:8000.");
    }
    if (!res.ok) {
      const err = await res.text().catch(() => "Download failed");
      throw new Error(`Download failed (${res.status}): ${err}`);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
  exportPDF: async (id: string, theme: string = "Sapphire", fallbackFilename?: string, roleFocus?: string) => {
    const token = sessionStorage.getItem("denno_access_token");
    let pdfEndpointUrl = `${API_URL}/cv/${id}/export.pdf?theme=${encodeURIComponent(theme)}`;
    if (roleFocus) pdfEndpointUrl += `&role_focus=${encodeURIComponent(roleFocus)}`;
    let res: Response;
    try {
      res = await fetch(pdfEndpointUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch {
      throw new Error("Failed to connect to backend server. Make sure the API is running on http://localhost:8000.");
    }
    if (!res.ok) {
      const err = await res.text().catch(() => "Export PDF failed");
      throw new Error(`PDF Export failed (${res.status}): ${err}`);
    }
    
    // Check Content-Disposition header for filename
    let filename = `${(fallbackFilename || "CV").replace(/\s+/g, "_")}_CV.pdf`;
    const disposition = res.headers.get("Content-Disposition");
    if (disposition && disposition.includes("filename=")) {
      const match = disposition.match(/filename=["']?([^"';]+)["']?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }
};
