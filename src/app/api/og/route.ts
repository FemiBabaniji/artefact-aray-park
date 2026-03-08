import { NextRequest, NextResponse } from "next/server";

type OGData = {
  url:          string;
  title?:       string;
  description?: string;
  image?:       string;
  siteName?:    string;
  favicon?:     string;
  type?:        "article" | "video" | "image" | "website";
};

// Extract meta content from HTML using regex (no external parser needed)
function extractMeta(html: string, property: string): string | undefined {
  // Try og: prefix first
  const ogRegex = new RegExp(
    `<meta[^>]*(?:property|name)=["']og:${property}["'][^>]*content=["']([^"']*)["']|` +
    `<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']og:${property}["']`,
    "i"
  );
  const ogMatch = html.match(ogRegex);
  if (ogMatch) return ogMatch[1] || ogMatch[2];

  // Try twitter: prefix
  const twRegex = new RegExp(
    `<meta[^>]*(?:property|name)=["']twitter:${property}["'][^>]*content=["']([^"']*)["']|` +
    `<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']twitter:${property}["']`,
    "i"
  );
  const twMatch = html.match(twRegex);
  if (twMatch) return twMatch[1] || twMatch[2];

  // Try standard meta name
  const stdRegex = new RegExp(
    `<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']|` +
    `<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${property}["']`,
    "i"
  );
  const stdMatch = html.match(stdRegex);
  return stdMatch ? stdMatch[1] || stdMatch[2] : undefined;
}

function extractTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match ? match[1].trim() : undefined;
}

function extractFavicon(html: string, baseUrl: string): string | undefined {
  // Try link rel="icon" or rel="shortcut icon"
  const iconRegex = /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']*)["']/i;
  const match = html.match(iconRegex);

  if (match) {
    const href = match[1];
    if (href.startsWith("http")) return href;
    if (href.startsWith("//")) return `https:${href}`;
    if (href.startsWith("/")) return `${baseUrl}${href}`;
    return `${baseUrl}/${href}`;
  }

  // Fallback to /favicon.ico
  return `${baseUrl}/favicon.ico`;
}

function resolveUrl(url: string, baseUrl: string): string {
  if (!url) return url;
  if (url.startsWith("http")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${baseUrl}${url}`;
  return `${baseUrl}/${url}`;
}

function getBaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return url;
  }
}

function detectType(html: string): OGData["type"] {
  const ogType = extractMeta(html, "type");
  if (ogType?.includes("video")) return "video";
  if (ogType?.includes("article")) return "article";
  if (ogType?.includes("image")) return "image";
  return "website";
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LinkPreview/1.0)",
        "Accept": "text/html,application/xhtml+xml",
      },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch URL" }, { status: 502 });
    }

    const contentType = res.headers.get("content-type") || "";

    // Handle image URLs directly
    if (contentType.startsWith("image/")) {
      const data: OGData = {
        url,
        title: url.split("/").pop() || "Image",
        image: url,
        type: "image",
      };
      return NextResponse.json(data);
    }

    // Only process HTML
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return NextResponse.json({
        url,
        title: url.split("/").pop() || url,
        type: "website"
      });
    }

    const html = await res.text();
    const baseUrl = getBaseUrl(url);

    const data: OGData = {
      url,
      title:       extractMeta(html, "title") || extractTitle(html),
      description: extractMeta(html, "description"),
      image:       resolveUrl(extractMeta(html, "image") || "", baseUrl) || undefined,
      siteName:    extractMeta(html, "site_name") || new URL(url).hostname,
      favicon:     extractFavicon(html, baseUrl),
      type:        detectType(html),
    };

    // Clean up empty fields
    Object.keys(data).forEach(key => {
      if (data[key as keyof OGData] === "") {
        delete data[key as keyof OGData];
      }
    });

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ error: "Request timeout" }, { status: 504 });
    }
    return NextResponse.json({ error: "Failed to fetch metadata" }, { status: 500 });
  }
}
