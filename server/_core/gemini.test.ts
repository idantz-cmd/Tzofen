import { describe, it, expect, vi, beforeEach } from "vitest";

// callGemini is now backed by the OpenAI SDK (gpt-4.1-nano), not the Gemini REST
// API. Mock the SDK and the env so the client always has a key.
const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }));

vi.mock("./env", () => ({
  ENV: { aiApiKey: "test-key" },
}));

vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create: createMock } };
  },
}));

import { callGemini } from "./gemini";

describe("callGemini (OpenAI-backed)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the model's message content on success", async () => {
    createMock.mockResolvedValueOnce({
      choices: [{ message: { content: "Test response" } }],
    });

    const response = await callGemini("test prompt");
    expect(response).toBe("Test response");
    expect(createMock).toHaveBeenCalledOnce();
  });

  it("propagates errors thrown by the OpenAI SDK", async () => {
    createMock.mockRejectedValueOnce(new Error("Invalid API key"));

    await expect(callGemini("test")).rejects.toThrow("Invalid API key");
  });

  it("returns an empty string when no choices are returned", async () => {
    createMock.mockResolvedValueOnce({ choices: [] });

    const response = await callGemini("test");
    expect(response).toBe("");
  });

  it("returns an empty string when the message has no content", async () => {
    createMock.mockResolvedValueOnce({ choices: [{ message: {} }] });

    const response = await callGemini("test");
    expect(response).toBe("");
  });
});
