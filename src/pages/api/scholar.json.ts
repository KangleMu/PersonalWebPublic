import type { APIRoute } from "astro";

const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours (once per day)

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

type SerpApiResponse = {
  search_metadata?: {
    status: string;
  };
  error?: string;
  cited_by?: {
    table?: Array<{
      citations?: { all: number };
      h_index?: { all: number };
      i10_index?: { all: number };
      // French locale fallback
      indice_h?: { all: number };
      indice_i10?: { all: number };
    }>;
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

export const GET: APIRoute = async ({ request }) => {
  const cached = getCache();
  if (cached) {
    return new Response(JSON.stringify(cached.payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400" // 24 hours browser/CDN cache
      }
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

  const apiKey = import.meta.env.SERPAPI_KEY ?? import.meta.env.PUBLIC_SERPAPI_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        status: "missing_config",
        message: "Set SERPAPI_KEY or PUBLIC_SERPAPI_KEY environment variable to use SerpAPI."
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  const serpApiUrl = new URL("https://serpapi.com/search");
  serpApiUrl.searchParams.set("engine", "google_scholar_author");
  serpApiUrl.searchParams.set("author_id", authorId);
  serpApiUrl.searchParams.set("hl", "en");
  serpApiUrl.searchParams.set("api_key", apiKey);

  const response = await fetch(serpApiUrl.toString());
  if (!response.ok) {
    const statusText = response.statusText || "Upstream error";
    const message = `SerpAPI ${response.status} ${statusText}.`;
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

  const data: SerpApiResponse = await response.json();

  if (data.error || data.search_metadata?.status !== "Success") {
    const errorMessage = data.error || "SerpAPI request failed";
    return new Response(
      JSON.stringify({
        status: "error",
        message: errorMessage
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  // Extract metrics from cited_by.table array
  const table = data.cited_by?.table || [];
  let citations = 0;
  let hIndex = 0;
  let i10Index = 0;

  for (const item of table) {
    if (item.citations?.all !== undefined) {
      citations = item.citations.all;
    }
    // Handle both English (h_index) and French (indice_h) locale keys
    if (item.h_index?.all !== undefined) {
      hIndex = item.h_index.all;
    } else if (item.indice_h?.all !== undefined) {
      hIndex = item.indice_h.all;
    }
    // Handle both English (i10_index) and French (indice_i10) locale keys
    if (item.i10_index?.all !== undefined) {
      i10Index = item.i10_index.all;
    } else if (item.indice_i10?.all !== undefined) {
      i10Index = item.indice_i10.all;
    }
  }

  const payload = {
    status: "ok",
    citations,
    hIndex,
    i10Index,
    updatedAt: new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
    source: "SerpAPI"
  };

  setCache(payload);

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400" // 24 hours browser/CDN cache
    }
  });
};
