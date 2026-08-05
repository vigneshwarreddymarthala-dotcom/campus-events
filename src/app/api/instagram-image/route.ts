import { type NextRequest, NextResponse } from "next/server";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
};

async function tryExtractOgImage(url: string): Promise<string | null> {
  const res = await fetch(url, { headers: BROWSER_HEADERS });
  const html = await res.text();
  const match =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ??
    html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
  if (!match) return null;
  return match[1].replace(/&amp;/g, "&").replace(/&#039;/g, "'");
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  if (!url.includes("instagram.com")) {
    return NextResponse.json({ error: "Not an Instagram URL" }, { status: 400 });
  }

  let imageUrl: string | null = null;

  // Attempt 1: og:image from post page
  try {
    imageUrl = await tryExtractOgImage(url);
  } catch {
    // continue to next attempt
  }

  // Attempt 2: og:image from mobile version
  if (!imageUrl) {
    try {
      const mobileUrl = url.replace("www.instagram.com", "m.instagram.com");
      imageUrl = await tryExtractOgImage(mobileUrl);
    } catch {
      // continue
    }
  }

  if (!imageUrl) {
    return NextResponse.json(
      { error: "blocked", message: "Instagram blocked the import." },
      { status: 403 }
    );
  }

  // JSON mode — just return the CDN URL without proxying (used as fallback)
  const mode = request.nextUrl.searchParams.get("mode");
  if (mode === "json") {
    return NextResponse.json({ imageUrl });
  }

  // Proxy the image so the client avoids CORS for Supabase upload
  try {
    const imgRes = await fetch(imageUrl, { headers: BROWSER_HEADERS });
    if (!imgRes.ok) throw new Error("Image fetch failed");
    const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
    const buffer = await imgRes.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return NextResponse.json({ imageUrl }, { status: 200 });
  }
}
