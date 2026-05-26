export const sanitizeString = (input: string): string => {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
};

export const sanitizeChatMessage = (message: string): string => {
  if (message.length > 500) throw new Error('הודעה ארוכה מדי');
  return sanitizeString(message);
};

export const sanitizeCompetitionName = (name: string): string => {
  if (name.length > 50) throw new Error('שם ארוך מדי');
  return sanitizeString(name);
};
