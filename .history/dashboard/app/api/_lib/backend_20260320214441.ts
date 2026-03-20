const DEFAULT_BACKEND_BASE = "http://localhost:8000";

function getBackendBaseUrl(): string {
  return process.env.RIDEGUARD_BACKEND_URL ?? DEFAULT_BACKEND_BASE;
}

export async function fetchBackend(path: string, init?: RequestInit): Promise<Response> {
  const backendUrl = `${getBackendBaseUrl()}${path}`;
  return fetch(backendUrl, { ...init, cache: "no-store" });
}
