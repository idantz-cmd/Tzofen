import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";

// TODO: implement with new schema — `chatMessages` table was removed in the schema
// migration. All procedures stub-throw NOT_IMPLEMENTED (or return empty data) so the
// tRPC router keeps the same surface area without referencing removed tables.

const NOT_IMPL = new TRPCError({
  code: "NOT_IMPLEMENTED",
  message: "צ'אט בין משתמשים אינו זמין במהדורה הנוכחית",
});

export const userChatRouter = router({
  // Get conversations list (unique users I've chatted with)
  getConversations: protectedProcedure.query(async () => {
    return [] as Array<{
      userId: number;
      userName: string;
      lastMessage: string;
      lastMessageAt: Date;
      unreadCount: number;
    }>;
  }),

  // Get messages with a specific user
  getMessages: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        cursor: z.number().optional(),
      })
    )
    .query(async () => {
      return {
        messages: [] as Array<{
          id: number;
          senderId: number;
          receiverId: number;
          message: string;
          isRead: boolean | null;
          createdAt: Date;
        }>,
        hasMore: false,
      };
    }),

  // Send a message
  send: protectedProcedure
    .input(
      z.object({
        receiverId: z.number(),
        content: z.string().min(1).max(1000),
      })
    )
    .mutation(async () => {
      throw NOT_IMPL;
    }),

  // Get unread count
  getUnreadCount: protectedProcedure.query(async () => {
    return 0;
  }),

  // Get all users (for starting new conversations)
  getAvailableUsers: protectedProcedure.query(async () => {
    return [] as Array<{ id: number; name: string | null }>;
  }),
});
