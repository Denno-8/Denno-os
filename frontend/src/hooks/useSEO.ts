/**
 * useSEO — React hook for per-page dynamic meta tags.
 *
 * Usage:
 *   useSEO({
 *     title: "Jobs — Denno Career OS",
 *     description: "Browse and track job listings ...",
 *   });
 *
 * The hook uses react-helmet-async under the hood so it is SSR-safe
 * and plays nicely with concurrent mode.
 */

import { useEffect } from "react";

interface SEOOptions {
  /** Page-specific title. Appended with " | Denno Career OS" if it doesn't include the brand. */
  title?: string;
  /** Page-specific meta description (≤ 155 chars recommended). */
  description?: string;
  /** Canonical URL override for this page (full URL). */
  canonical?: string;
  /** Open Graph image override (full URL). */
  ogImage?: string;
  /** If true, tells crawlers not to index this page (e.g., auth-gated routes). */
  noIndex?: boolean;
}

const BRAND = "Denno Career OS";
const BASE_URL = "https://denno.app";

function setMeta(name: string, content: string, property = false) {
  const attr = property ? "property" : "name";
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

export function useSEO({
  title,
  description,
  canonical,
  ogImage,
  noIndex = false,
}: SEOOptions = {}) {
  useEffect(() => {
    // ── Title ──────────────────────────────────────────────────
    const fullTitle = title
      ? title.includes(BRAND)
        ? title
        : `${title} | ${BRAND}`
      : `${BRAND} — AI Career OS`;
    document.title = fullTitle;

    // ── Robots ─────────────────────────────────────────────────
    setMeta("robots", noIndex ? "noindex, nofollow" : "index, follow");

    // ── Description ────────────────────────────────────────────
    if (description) {
      setMeta(
        "description",
        description.length > 160 ? description.slice(0, 157) + "..." : description
      );
    }

    // ── Open Graph ─────────────────────────────────────────────
    setMeta("og:title", fullTitle, true);
    if (description) setMeta("og:description", description, true);
    const ogUrl = canonical ?? (BASE_URL + window.location.pathname);
    setMeta("og:url", ogUrl, true);
    if (ogImage) setMeta("og:image", ogImage, true);

    // ── Twitter Card ───────────────────────────────────────────
    setMeta("twitter:title", fullTitle);
    if (description) setMeta("twitter:description", description);

    // ── Canonical ──────────────────────────────────────────────
    setLink("canonical", canonical ?? ogUrl);
  }, [title, description, canonical, ogImage, noIndex]);
}
