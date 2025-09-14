import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const agentRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      objective: z.string(),
      defensePrompt: z.string(),
      iterations: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Call Python backend to create agent in MongoDB
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/agents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: input.name,
          objective: input.objective,
          defense_system_prompt: input.defensePrompt,
          iterations: input.iterations,
          model_provider: "cerebras",
          model_name: "llama-4-scout-17b-16e-instruct"
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create agent in backend');
      }

      const result = await response.json();
      return { id: result.agent_id, name: input.name };
    }),

  // Keep existing Prisma-based methods for compatibility
  createPrisma: protectedProcedure
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
