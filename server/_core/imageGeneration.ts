export async function generateImage(_params: {
  prompt: string;
  originalImages?: Array<{ url: string; mimeType: string }>;
}): Promise<{ url: string }> {
  throw new Error("Image generation not available in local mode");
}

