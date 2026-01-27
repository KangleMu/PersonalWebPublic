import type { APIRoute } from "astro";

const CACHE_TTL_MS = 1000 * 60 * 60 * 6;

type ScholarCache = {
  expiresAt: number;
  payload: {
    status: "ok";
    citations: number;
    hIndex: number;
    i10Index: number;
    updatedAt: string;
    source: string;
    message?: string;
  };
};

const getCache = (): ScholarCache | null => {
  const cache = (globalThis as { __scholarCache?: ScholarCache }).__scholarCache;
  if (!cache || Date.now() > cache.expiresAt) {
    return null;
  }
  return cache;
};

const setCache = (payload: ScholarCache["payload"]) => {
  (globalThis as { __scholarCache?: ScholarCache }).__scholarCache = {
    expiresAt: Date.now() + CACHE_TTL_MS,
    payload
  };
};

const parseMetric = (html: string, label: string) => {
  const regex = new RegExp(
    `${label}<\\/a>\\s*<\\/td>\\s*<td class="gsc_rsb_std">(\\d[\\d,]*)<`,
    "i"
  );
  const match = html.match(regex);
  return match ? Number.parseInt(match[1].replace(/,/g, ""), 10) || 0 : 0;
};

export const GET: APIRoute = async ({ request }) => {
  const cached = getCache();
  if (cached) {
    return new Response(JSON.stringify(cached.payload), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  const authorId =
    new URL(request.url).searchParams.get("authorId") ??
    import.meta.env.PUBLIC_GOOGLE_SCHOLAR_AUTHOR_ID ??
    "3nL-yukAAAAJ";

  if (!authorId) {
    return new Response(
      JSON.stringify({
        status: "missing_config",
        message: "Set PUBLIC_GOOGLE_SCHOLAR_AUTHOR_ID or pass ?authorId=... to enable stats."
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  const url = new URL("https://scholar.google.com/citations");
  url.searchParams.set("user", authorId);
  url.searchParams.set("hl", "en");

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  });
  if (!response.ok) {
    const statusText = response.statusText || "Upstream error";
    const message = `Upstream ${response.status} ${statusText}.`;
    return new Response(
      JSON.stringify({
        status: "error",
        message
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  const html = await response.text();
  const citations = parseMetric(html, "Citations");
  const hIndex = parseMetric(html, "h-index");
  const i10Index = parseMetric(html, "i10-index");

  const payload = {
    status: "ok",
    citations,
    hIndex,
    i10Index,
    updatedAt: new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
    source: "Google Scholar"
  };

  setCache(payload);

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};
