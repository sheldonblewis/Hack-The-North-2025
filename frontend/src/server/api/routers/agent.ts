import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const agentRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      endpoint: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.agent.create({
        data: {
          ...input,
          createdById: ctx.session.user.id,
        },
      });
    }),

  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.agent.findMany({
        where: {
          createdById: ctx.session.user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          _count: {
            select: {
              testRuns: true,
            },
          },
        },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.agent.findUnique({
        where: {
          id: input.id,
          createdById: ctx.session.user.id,
        },
        include: {
          testRuns: {
            orderBy: {
              createdAt: "desc",
            },
            take: 10, // Latest 10 test runs
            include: {
              createdBy: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              testRuns: true,
            },
          },
        },
      });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      endpoint: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.agent.update({
        where: {
          id,
          createdById: ctx.session.user.id,
        },
        data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.agent.delete({
        where: {
          id: input.id,
          createdById: ctx.session.user.id,
        },
      });
    }),
});