/**
 * Central API configuration.
 * All fetch calls should use `API_URL` instead of hardcoded localhost:5000.
 */
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

/**
 * Convenience helper that wraps fetch with the base API URL and auth header.
 */
export async function apiFetch(
    path: string,
    token: string,
    options: RequestInit = {}
): Promise<Response> {
    const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers as Record<string, string> || {}),
    };
    return fetch(`${API_URL}${path}`, { ...options, headers });
}

/**
 * Keeps the Render backend awake by pinging it every 10 minutes.
 * Render free tier shuts down after 15 min of inactivity causing 30-60s cold starts.
 * Call once on app mount.
 */
export function keepBackendAlive() {
    const ping = () => fetch(`${API_URL}/api/health`, { method: 'GET' }).catch(() => { });
    ping(); // immediate ping on load
    setInterval(ping, 10 * 60 * 1000); // every 10 minutes
}
