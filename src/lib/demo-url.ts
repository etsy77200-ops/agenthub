/** Non-empty http(s) URL string after trim. */
export function parseDemoUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return trimmed;
  } catch {
    return null;
  }
}

export function demoUrlErrorMessage(): string {
  return "Enter a valid demo link starting with https:// (e.g. Loom, YouTube, or a live preview).";
}

/** Buyers receive this only after a successful paid order. Must be https. */
export function parseAgentAccessUrl(raw: string): string | null {
  const base = parseDemoUrl(raw);
  if (!base) return null;
  try {
    if (new URL(base).protocol !== "https:") return null;
    return base;
  } catch {
    return null;
  }
}

export function agentAccessUrlErrorMessage(): string {
  return "Enter a valid production link starting with https:// (app URL, API portal, or invite link buyers use after purchase).";
}
