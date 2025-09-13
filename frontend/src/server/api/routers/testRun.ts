import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const testRunRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      agentId: z.string(),
      name: z.string(),
      description: z.string().optional(),
      targetEndpoint: z.string().url(),
      selectedRisks: z.array(z.string()),
      selectedAttacks: z.array(z.string()),
      numPrompts: z.number().min(1).max(1000),
      timeout: z.number().min(5).max(300),
      concurrency: z.number().min(1).max(20),
      customPrompts: z.string().optional(),
      successThreshold: z.number().min(0).max(100),
      enableLogging: z.boolean(),
      generateReport: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.testRun.create({
        data: {
          ...input,
          createdById: ctx.session.user.id,
        },
      });
    }),

  getByAgentId: protectedProcedure
    .input(z.object({ agentId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.testRun.findMany({
        where: {
          agentId: input.agentId,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.testRun.findUnique({
        where: {
          id: input.id,
        },
        include: {
          agent: true,
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(["PENDING", "RUNNING", "COMPLETED", "FAILED", "CANCELLED"]),
      totalPrompts: z.number().optional(),
      successfulAttacks: z.number().optional(),
      attackSuccessRate: z.number().optional(),
      reportUrl: z.string().optional(),
      logUrl: z.string().optional(),
      startedAt: z.date().optional(),
      completedAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.testRun.update({
        where: {
          id: input.id,
        },
        data: input,
      });
    }),

  duplicate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const originalRun = await ctx.db.testRun.findUnique({
        where: { id: input.id },
      });

      if (!originalRun) {
        throw new Error("Test run not found");
      }

      return ctx.db.testRun.create({
        data: {
          name: `${originalRun.name} (Copy)`,
          description: originalRun.description,
          targetEndpoint: originalRun.targetEndpoint,
          selectedRisks: originalRun.selectedRisks,
          selectedAttacks: originalRun.selectedAttacks,
          numPrompts: originalRun.numPrompts,
          timeout: originalRun.timeout,
          concurrency: originalRun.concurrency,
          customPrompts: originalRun.customPrompts,
          successThreshold: originalRun.successThreshold,
          enableLogging: originalRun.enableLogging,
          generateReport: originalRun.generateReport,
          agentId: originalRun.agentId,
          createdById: ctx.session.user.id,
        },
      });
    }),
});
