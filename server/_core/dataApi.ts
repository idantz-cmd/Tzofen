export async function callDataApi(
  _endpoint: string,
  _params?: Record<string, unknown>
): Promise<unknown> {
  throw new Error("Data API not available in local mode");
}

