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
