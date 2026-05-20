import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { chatMessages, users } from "../../drizzle/schema";
import { eq, and, or, desc, sql } from "drizzle-orm";

export const userChatRouter = router({
  // Get conversations list (unique users I've chatted with)
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    if (!db) return [];

    // Get distinct users I've chatted with
    const sent = await db
      .select({ receiverId: chatMessages.receiverId })
      .from(chatMessages)
      .where(eq(chatMessages.senderId, ctx.user.id))
      .groupBy(chatMessages.receiverId);

    const received = await db
      .select({ senderId: chatMessages.senderId })
      .from(chatMessages)
      .where(eq(chatMessages.receiverId, ctx.user.id))
      .groupBy(chatMessages.senderId);

    const userIds = new Set([
      ...sent.map((s) => s.receiverId),
      ...received.map((r) => r.senderId),
    ]);

    if (userIds.size === 0) return [];

    // Get user details and last message for each conversation
    const conversations = [];
    for (const userId of Array.from(userIds)) {
      const [user] = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const [lastMessage] = await db
        .select()
        .from(chatMessages)
        .where(
          or(
            and(
              eq(chatMessages.senderId, ctx.user.id),
              eq(chatMessages.receiverId, userId)
            ),
            and(
              eq(chatMessages.senderId, userId),
              eq(chatMessages.receiverId, ctx.user.id)
            )
          )
        )
        .orderBy(desc(chatMessages.createdAt))
        .limit(1);

      // Count unread messages
      const [unreadResult] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.senderId, userId),
            eq(chatMessages.receiverId, ctx.user.id),
            eq(chatMessages.isRead, false)
          )
        );

      conversations.push({
        userId: user?.id || userId,
        userName: user?.name || "×ž×©×ª×ž×©",
        lastMessage: lastMessage?.message || "",
        lastMessageAt: lastMessage?.createdAt || new Date(),
        unreadCount: unreadResult?.count || 0,
      });
    }

    // Sort by last message time
    conversations.sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime()
    );

    return conversations;
  }),

  // Get messages with a specific user
  getMessages: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        cursor: z.number().optional(), // for pagination
      })
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      if (!db) return { messages: [], hasMore: false };

      const limit = 50;
      const query = db
        .select({
          id: chatMessages.id,
          senderId: chatMessages.senderId,
          receiverId: chatMessages.receiverId,
          message: chatMessages.message,
          isRead: chatMessages.isRead,
          createdAt: chatMessages.createdAt,
        })
        .from(chatMessages)
        .where(
          or(
            and(
              eq(chatMessages.senderId, ctx.user.id),
              eq(chatMessages.receiverId, input.userId)
            ),
            and(
              eq(chatMessages.senderId, input.userId),
              eq(chatMessages.receiverId, ctx.user.id)
            )
          )
        )
        .orderBy(desc(chatMessages.createdAt))
        .limit(limit + 1);

      const messages = await query;

      const hasMore = messages.length > limit;
      const trimmed = hasMore ? messages.slice(0, limit) : messages;

      // Mark received messages as read
      await db
        .update(chatMessages)
        .set({ isRead: true })
        .where(
          and(
            eq(chatMessages.senderId, input.userId),
            eq(chatMessages.receiverId, ctx.user.id),
            eq(chatMessages.isRead, false)
          )
        );

      return {
        messages: trimmed.reverse(), // oldest first for display
        hasMore,
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
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      if (!db) throw new Error("Database unavailable");

      if (input.receiverId === ctx.user.id) {
        throw new Error("×œ× × ×™×ª×Ÿ ×œ×©×œ×•×— ×”×•×“×¢×” ×œ×¢×¦×ž×š");
      }

      // Verify recipient exists
      const [recipient] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, input.receiverId))
        .limit(1);

      if (!recipient) throw new Error("×ž×©×ª×ž×© ×œ× × ×ž×¦×");

      const result = await db.insert(chatMessages).values({
        senderId: ctx.user.id,
        receiverId: input.receiverId,
        message: input.content,
        isRead: false,
      });

      return {
        id: Number(result.lastInsertRowid),
        senderId: ctx.user.id,
        receiverId: input.receiverId,
        message: input.content,
        isRead: false,
        createdAt: new Date(),
      };
    }),

  // Get unread count
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    if (!db) return 0;

    const [result] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.receiverId, ctx.user.id),
          eq(chatMessages.isRead, false)
        )
      );

    return result?.count || 0;
  }),

  // Get all users (for starting new conversations)
  getAvailableUsers: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    if (!db) return [];

    const allUsers = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(sql`${users.id} != ${ctx.user.id}`)
      .orderBy(users.name);

    return allUsers;
  }),
});

