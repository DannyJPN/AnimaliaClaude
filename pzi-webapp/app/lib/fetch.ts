export async function fetchJson<T>(request: string | URL, init?: RequestInit) {
  const response = await fetch(request, init);
  return await response.json() as T;
}
