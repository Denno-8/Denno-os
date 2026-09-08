import { api } from "./api";

/**
 * Service for fetching and analyzing tech job listings from OpenedCareer.
 */
export interface JobListing {
  id: string;
  title: string;
  company: string;
  location?: string;
  remote?: boolean;
  posted_at?: string; // ISO date string
  url?: string;
}

/**
 * Fetch the raw job feed from the OpenedCareer endpoint via Denno backend API.
 * Returns an array of JobListing objects or throws an error.
 */
export async function fetchJobFeed(): Promise<JobListing[]> {
  try {
    const data = await api.get<JobListing[]>("/jobs/feed/openedcareer");
    if (Array.isArray(data)) {
      return data;
    }
  } catch (err) {
    console.error("Error fetching job feed from Denno API:", err);
  }

  // Fallback to direct fetch if backend API call is unreachable
  const DIRECT_URL = "https://openedcareer.com/job";
  try {
    const response = await fetch(DIRECT_URL);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        return data as JobListing[];
      } else if (Array.isArray((data as any).jobs)) {
        return (data as any).jobs as JobListing[];
      }
    }
  } catch (_e) {
    // Fallback failed as well
  }

  throw new Error("Failed to fetch OpenedCareer job feed. Please check backend connection.");
}

/**
 * Basic analysis utilities for a set of job listings.
 */
export const jobAnalysis = {
  /** Count total number of jobs */
  totalJobs(jobs: JobListing[]): number {
    return jobs.length;
  },

  /** Group jobs by company */
  groupByCompany(jobs: JobListing[]): Record<string, JobListing[]> {
    return jobs.reduce((acc, job) => {
      const key = job.company || "Unknown";
      if (!acc[key]) acc[key] = [];
      acc[key].push(job);
      return acc;
    }, {} as Record<string, JobListing[]>);
  },

  /** Filter remote positions */
  remoteOnly(jobs: JobListing[]): JobListing[] {
    return jobs.filter((j) => j.remote === true);
  },

  /** Simple statistics: jobs per location */
  jobsPerLocation(jobs: JobListing[]): Record<string, number> {
    return jobs.reduce((acc, job) => {
      const loc = job.location || "Unspecified";
      acc[loc] = (acc[loc] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  },
};

// Example usage (remove or adapt in production code):
// (async () => {
//   const jobs = await fetchJobFeed();
//   console.log("Total jobs:", jobAnalysis.totalJobs(jobs));
//   console.log("Jobs by company:", jobAnalysis.groupByCompany(jobs));
// })();
