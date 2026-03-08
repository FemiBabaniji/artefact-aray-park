import { useState, useCallback, useRef, useEffect } from "react";
import type { LinkMeta } from "@/types/section";

// URL regex - matches http/https URLs
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;

// Extract URLs from text/HTML content
export function extractUrls(content: string): string[] {
  // Strip HTML tags for cleaner extraction
  const text = content.replace(/<[^>]+>/g, " ");
  const matches = text.match(URL_REGEX) || [];
  // Deduplicate and clean trailing punctuation
  return [...new Set(matches.map(url =>
    url.replace(/[.,;:!?)]+$/, "")
  ))];
}

// Check if URL is likely an image
export function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg|ico)(\?.*)?$/i.test(url);
}

// Fetch OG metadata for a URL
async function fetchOgData(url: string): Promise<LinkMeta> {
  try {
    const res = await fetch(`/api/og?url=${encodeURIComponent(url)}`);
    if (!res.ok) {
      return { url, fetched: true, error: true };
    }
    const data = await res.json();
    return {
      url,
      title:       data.title,
      description: data.description,
      image:       data.image,
      siteName:    data.siteName,
      favicon:     data.favicon,
      type:        data.type,
      fetched:     true,
    };
  } catch {
    return { url, fetched: true, error: true };
  }
}

type UseLinksOptions = {
  maxLinks?:      number;
  debounceMs?:    number;
  autoFetch?:     boolean;
  initialLinks?:  LinkMeta[];
};

type UseLinksReturn = {
  links:        LinkMeta[];
  addUrl:       (url: string) => void;
  removeUrl:    (url: string) => void;
  removeIndex:  (index: number) => void;
  detectLinks:  (content: string) => void;
  refetch:      (url: string) => void;
  clearLinks:   () => void;
  isLoading:    boolean;
};

export function useLinks(options: UseLinksOptions = {}): UseLinksReturn {
  const {
    maxLinks = 10,
    debounceMs = 500,
    autoFetch = true,
    initialLinks = [],
  } = options;

  const [links, setLinks] = useState<LinkMeta[]>(initialLinks);
  const [isLoading, setIsLoading] = useState(false);
  const pendingUrls = useRef<Set<string>>(new Set());
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const knownUrls = useRef<Set<string>>(new Set(initialLinks.map(l => l.url)));

  // Fetch and add a single URL
  const addUrl = useCallback(async (url: string) => {
    if (knownUrls.current.has(url) || pendingUrls.current.has(url)) return;
    if (knownUrls.current.size >= maxLinks) return;

    pendingUrls.current.add(url);
    knownUrls.current.add(url);

    // Add placeholder immediately
    setLinks(prev => [...prev, { url, fetched: false }]);

    if (autoFetch) {
      setIsLoading(true);
      const meta = await fetchOgData(url);
      setLinks(prev => prev.map(l => l.url === url ? meta : l));
      pendingUrls.current.delete(url);
      setIsLoading(pendingUrls.current.size > 0);
    }
  }, [maxLinks, autoFetch]);

  // Remove by URL
  const removeUrl = useCallback((url: string) => {
    setLinks(prev => prev.filter(l => l.url !== url));
    knownUrls.current.delete(url);
    pendingUrls.current.delete(url);
  }, []);

  // Remove by index
  const removeIndex = useCallback((index: number) => {
    setLinks(prev => {
      const link = prev[index];
      if (link) {
        knownUrls.current.delete(link.url);
        pendingUrls.current.delete(link.url);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // Detect links from content (debounced)
  const detectLinks = useCallback((content: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      const urls = extractUrls(content);
      urls.forEach(url => addUrl(url));
    }, debounceMs);
  }, [addUrl, debounceMs]);

  // Re-fetch a specific URL
  const refetch = useCallback(async (url: string) => {
    setIsLoading(true);
    const meta = await fetchOgData(url);
    setLinks(prev => prev.map(l => l.url === url ? meta : l));
    setIsLoading(false);
  }, []);

  // Clear all links
  const clearLinks = useCallback(() => {
    setLinks([]);
    knownUrls.current.clear();
    pendingUrls.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    links,
    addUrl,
    removeUrl,
    removeIndex,
    detectLinks,
    refetch,
    clearLinks,
    isLoading,
  };
}

// Helper to merge existing links with newly detected ones
export function mergeLinks(existing: LinkMeta[], detected: string[]): LinkMeta[] {
  const existingUrls = new Set(existing.map(l => l.url));
  const newLinks = detected
    .filter(url => !existingUrls.has(url))
    .map(url => ({ url, fetched: false }));
  return [...existing, ...newLinks];
}
