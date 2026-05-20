import { describe, it, expect, vi, beforeEach } from "vitest";
import { callGemini } from "./gemini";

// Mock fetch
vi.stubGlobal("fetch", vi.fn());

describe("Gemini API Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call Gemini API successfully", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: "Test response" }],
            },
          },
        ],
      }),
    } as any);

    const response = await callGemini("test prompt");
    expect(response).toBe("Test response");
    expect(mockFetch).toHaveBeenCalled();
  });

  it("should handle Gemini API errors", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: "Unauthorized",
      json: async () => ({
        error: { message: "Invalid API key" },
      }),
    } as any);

    try {
      await callGemini("test");
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("Gemini API error");
    }
  });

  it("should handle empty response from API", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [],
      }),
    } as any);

    try {
      await callGemini("test");
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("No response from Gemini API");
    }
  });

  it("should handle malformed response format", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [],
            },
          },
        ],
      }),
    } as any);

    try {
      await callGemini("test");
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("Invalid response format");
    }
  });
});

