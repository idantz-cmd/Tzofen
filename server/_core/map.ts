export async function makeRequest<T>(
  _endpoint: string,
  _params?: Record<string, unknown>
): Promise<T> {
  throw new Error("Maps API not available in local mode");
}

