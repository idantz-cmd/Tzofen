import { z } from 'zod';

// --- Auth ---
export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'שם חייב להכיל לפחות 2 תווים')
    .max(30, 'שם ארוך מדי')
    .regex(/^[֐-׿a-zA-Z0-9 ]+$/, 'תווים לא חוקיים בשם'),

  email: z
    .string()
    .email('כתובת אימייל לא תקינה')
    .max(254)
    .transform(s => s.toLowerCase().trim()),

  password: z
    .string()
    .min(8, 'סיסמה חייבת להכיל לפחות 8 תווים')
    .max(72)
    .regex(/[A-Z]/, 'חייב להכיל לפחות אות גדולה')
    .regex(/[0-9]/, 'חייב להכיל לפחות ספרה'),
});

export const loginSchema = z.object({
  email:    z.string().email().transform(s => s.toLowerCase().trim()),
  password: z.string().min(1).max(72),
});

// --- Predictions ---
// prediction uses short UI values ('home'|'draw'|'away');
// router layer maps to DB enum ('home_win'|'draw'|'away_win') before saving.
export const predictionSchema = z.object({
  matchId: z.number().int().positive(),

  prediction: z.enum(['home', 'draw', 'away']),

  confidence: z.number().int().min(1).max(5).optional(),

  predictedHomeScore: z
    .number()
    .int()
    .min(0)
    .max(20)
    .optional(),

  predictedAwayScore: z
    .number()
    .int()
    .min(0)
    .max(20)
    .optional(),
});

// --- Competitions ---
export const createCompetitionSchema = z.object({
  name: z
    .string()
    .min(3, 'שם תחרות חייב להכיל לפחות 3 תווים')
    .max(50)
    .transform(s => s.trim()),

  type: z.enum(['tournament', 'head_to_head']),

  maxParticipants: z.number().int().min(2).max(20),
});

// --- Chat ---
export const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1)
    .max(500, 'הודעה ארוכה מדי — עד 500 תווים')
    .transform(s => s.trim()),

  sessionId: z.string().uuid(),
});

// --- Admin ---
export const publishResultSchema = z.object({
  matchId:   z.number().int().positive(),
  homeScore: z.number().int().min(0).max(20),
  awayScore: z.number().int().min(0).max(20),
});

// --- Types ---
export type RegisterInput    = z.infer<typeof registerSchema>;
export type PredictionInput  = z.infer<typeof predictionSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
