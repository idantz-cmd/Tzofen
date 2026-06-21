/**
 * Zod schemas for validating LLM (OpenAI/Gemini) JSON responses before they are
 * merged into a typed DeepMatchPrediction.
 *
 * Each field is `.optional().catch(undefined)`: if the model returns a wrong
 * type (e.g. "homeWinProb": "high"), an out-of-range number, or omits a field,
 * that field collapses to `undefined` — so the caller's statistical fallback
 * (`?? base`) applies instead of silently corrupting the prediction with a
 * mismatched value. The whole object falls back to `{}` if the payload isn't an
 * object at all (e.g. the model returned an array or a bare string).
 */
import { z } from "zod";

const optNum = (min: number, max: number) =>
  z.number().min(min).max(max).optional().catch(undefined);
const optBool = z.boolean().optional().catch(undefined);
const optStr = z.string().min(1).optional().catch(undefined);
const optStrArr = z.array(z.string()).optional().catch(undefined);

const predictionFields = {
  result: z.enum(["home_win", "draw", "away_win"]).optional().catch(undefined),
  homeWinProb: optNum(0, 100),
  drawProb: optNum(0, 100),
  awayWinProb: optNum(0, 100),
  predictedHomeGoals: optNum(0, 20),
  predictedAwayGoals: optNum(0, 20),
  totalGoalsOver25: optBool,
  predictedCorners: optNum(0, 30),
  cornersOver95: optBool,
  predictedYellowCards: optNum(0, 20),
  yellowCardsOver35: optBool,
  redCardExpected: optBool,
  resultReasoning: optStr,
  goalsReasoning: optStr,
  cornersReasoning: optStr,
  cardsReasoning: optStr,
  fullSummary: optStr,
  keyFactors: optStrArr,
};

/** Deep-prediction agent: the raw match analysis fields. */
export const llmDeepPredictionSchema = z.object(predictionFields).catch({});

/** Orchestrator synthesis: prediction fields + news influence. */
export const llmSynthesisSchema = z
  .object({
    ...predictionFields,
    newsInfluence: optStr,
    newsHeadlines: optStrArr,
  })
  .catch({});

export type LlmDeepPrediction = z.infer<typeof llmDeepPredictionSchema>;
export type LlmSynthesis = z.infer<typeof llmSynthesisSchema>;

/**
 * Parse an LLM JSON string. OpenAI's json_object mode returns clean JSON, but we
 * strip markdown code fences defensively in case a model wraps the payload.
 * Throws on malformed JSON — callers already catch and fall back statistically.
 */
export function parseLlmJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  return JSON.parse(cleaned);
}
