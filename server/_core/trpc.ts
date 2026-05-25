import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { UNAUTHED_ERR_MSG } from '@shared/const';
import type { Context } from './context';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
      },
    };
  },
});

export const router = t.router;

// כל אחד יכול לגשת
export const publicProcedure = t.procedure;

// רק משתמשים מחוברים
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: UNAUTHED_ERR_MSG, // client in main.tsx relies on this exact message to redirect to login
    });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

// רק admins
export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: UNAUTHED_ERR_MSG });
  }
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'אין הרשאת גישה לפעולה זו',
    });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
