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

const parseMetric = (table: Array<{ citations?: string; all?: string }> | undefined, name: string) => {
  const value = table?.find((row) => row.citations === name)?.all ?? "0";
  return Number.parseInt(value.replace(/,/g, ""), 10) || 0;
};

export const GET: APIRoute = async () => {
  const cached = getCache();
  if (cached) {
    return new Response(JSON.stringify(cached.payload), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  const apiKey = import.meta.env.SERPAPI_KEY;
  const authorId = import.meta.env.PUBLIC_GOOGLE_SCHOLAR_AUTHOR_ID;

  if (!apiKey || !authorId) {
    return new Response(
      JSON.stringify({
        status: "missing_config",
        message: "Set SERPAPI_KEY and PUBLIC_GOOGLE_SCHOLAR_AUTHOR_ID to enable stats."
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_scholar_author");
  url.searchParams.set("author_id", authorId);
  url.searchParams.set("api_key", apiKey);

  const response = await fetch(url.toString());
  if (!response.ok) {
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Unable to fetch citation stats from SerpAPI."
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  const data = await response.json();
  const table = data?.cited_by?.table ?? [];
  const citations = parseMetric(table, "Citations");
  const hIndex = parseMetric(table, "h-index");
  const i10Index = parseMetric(table, "i10-index");

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
    headers: { "Content-Type": "application/json" }
  });
};
