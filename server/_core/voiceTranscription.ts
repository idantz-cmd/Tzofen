export async function transcribeAudio(_params: {
  audioUrl: string;
  language?: string;
  prompt?: string;
}): Promise<{ text: string; language: string; segments: unknown[] }> {
  throw new Error("Voice transcription not available in local mode");
}

