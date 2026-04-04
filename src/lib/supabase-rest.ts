/**
 * Direct REST calls to Supabase PostgREST (same pattern as auth/login fetch).
 * The JS client's auth + query pipeline can hang in this Next.js stack; fetch + Bearer token does not.
 */

export function getAuthStorageKey(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  const projectRef = url.match(/https:\/\/([^.]+)/)?.[1];
  return projectRef ? `sb-${projectRef}-auth-token` : null;
}

type StoredAuthPayload = {
  user?: unknown;
  access_token?: string;
  refresh_token?: string;
};

function parseAuthRaw(raw: string | null): StoredAuthPayload | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAuthPayload;
  } catch {
    return null;
  }
}

/**
 * Read Supabase session JSON from localStorage (login page writes `sb-{ref}-auth-token`).
 * Also scans `sb-*-auth-token` keys so we still find the session if the URL/ref pattern differs.
 */
export function readStoredAuthFromLocalStorage(): {
  storageKey: string | null;
  user: unknown | null;
  access_token: string | null;
  refresh_token: string | null;
} {
  if (typeof window === "undefined") {
    return { storageKey: null, user: null, access_token: null, refresh_token: null };
  }

  const primary = getAuthStorageKey();
  if (primary) {
    const p = parseAuthRaw(localStorage.getItem(primary));
    if (p?.user) {
      return {
        storageKey: primary,
        user: p.user,
        access_token: p.access_token ?? null,
        refresh_token: p.refresh_token ?? null,
      };
    }
  }

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith("sb-") || !k.endsWith("-auth-token")) continue;
    const p = parseAuthRaw(localStorage.getItem(k));
    if (p?.user) {
      return {
        storageKey: k,
        user: p.user,
        access_token: p.access_token ?? null,
        refresh_token: p.refresh_token ?? null,
      };
    }
  }

  return { storageKey: null, user: null, access_token: null, refresh_token: null };
}

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const { access_token } = readStoredAuthFromLocalStorage();
  if (access_token) return access_token;
  const primary = getAuthStorageKey();
  if (!primary) return null;
  try {
    const raw = localStorage.getItem(primary);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { access_token?: string };
    return parsed.access_token ?? null;
  } catch {
    return null;
  }
}

/** Resolve with `timeout` if promise does not settle in time. */
export function raceWithTimeout<T>(promise: Promise<T>, ms: number): Promise<T | "timeout"> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve("timeout"), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      () => {
        clearTimeout(timer);
        resolve("timeout");
      }
    );
  });
}

export async function restGetJson<T>(pathAndQuery: string, timeoutMs = 15000): Promise<T> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const token = getStoredAccessToken();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}/rest/v1/${pathAndQuery}`, {
      signal: ctrl.signal,
      headers: {
        apikey: anon,
        Authorization: token ? `Bearer ${token}` : "",
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || res.statusText);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
