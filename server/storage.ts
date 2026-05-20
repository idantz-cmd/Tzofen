export async function storagePut(
  _key: string,
  _data: Buffer | Uint8Array | string,
  _contentType: string
): Promise<{ key: string; url: string }> {
  throw new Error("File storage not available in local mode");
}

