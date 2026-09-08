/**
 * Sanitizes skill lists by filtering out company names, location tags,
 * concatenated hashtags, and generic meta words.
 */
export function sanitizeSkillList(skills: string[]): string[] {
  if (!skills || !Array.isArray(skills)) return [];

  const BANNED_PATTERNS = [
    // Company / Organization names
    /\b(bmw|idealworks|aboosto|google|amazon|meta|apple|anthropic|safaricom|kca|group)\b/i,
    // Job portal / Location / Employment type hashtags
    /\b(start-up|startup|internship|internships|munichjobs|munich|nairobi|kenya|remote|hybrid|full-time|part-time|fulltime|parttime)\b/i,
    // Concatenated / Hashtag noise
    /\b(automationandrobotics|itsupport|itinternship|itinternships)\b/i,
    // Meta / Non-skill words
    /\b(innovation|growth|mentorship|responsibilities|qualifications|duties|requirements)\b/i,
  ];

  const cleaned = skills
    .map((s) => s.trim())
    .filter((s) => {
      if (!s || s.length < 2) return false;
      // Skip if matches any banned pattern
      if (BANNED_PATTERNS.some((pattern) => pattern.test(s))) return false;
      // Skip unspaced concatenated lowercase strings over 12 chars
      if (s.length > 12 && !s.includes(" ") && !s.includes("-") && !s.includes("/") && s === s.toLowerCase()) {
        return false;
      }
      return true;
    });

  return Array.from(new Set(cleaned));
}

export function formatCleanSkillsString(
  skills: string[],
  fallback: string = "IT Support, Systems Administration, Network Troubleshooting, Microsoft 365"
): string {
  const clean = sanitizeSkillList(skills);
  if (clean.length === 0) return fallback;
  return clean.slice(0, 6).join(", ");
}
