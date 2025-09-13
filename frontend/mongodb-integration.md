# MongoDB + T3 Stack Integration Guide

## 1. Setup MongoDB with Prisma Alternative

Since T3 stack uses Prisma by default, you have two options:

### Option A: Replace Prisma with MongoDB Native Driver
```bash
npm uninstall prisma @prisma/client
npm install mongodb @types/mongodb
```

### Option B: Use Prisma with MongoDB (Recommended for hackathon speed)
```bash
# Update your schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("MONGODB_URL")
}
```

## 2. Environment Variables

Add to your `.env`:
```env
# MongoDB Atlas connection string
MONGODB_URL="mongodb+srv://username:password@cluster.mongodb.net/ai-redteam?retryWrites=true&w=majority"

# Auth0 config (for user management)
AUTH0_SECRET="your-auth0-secret"
AUTH0_BASE_URL="http://localhost:3000"
AUTH0_ISSUER_BASE_URL="https://your-domain.auth0.com"
AUTH0_CLIENT_ID="your-client-id"
AUTH0_CLIENT_SECRET="your-client-secret"
```

## 3. Updated tRPC Routers

### Agent Router
```typescript
// src/server/api/routers/agent.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db"; // MongoDB connection

const agentCreateInput = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  modelConfig: z.object({
    provider: z.enum(["cohere", "openai", "anthropic", "google", "cerebras"]),
    modelName: z.string(),
    apiEndpoint: z.string().url(),
    parameters: z.record(z.any()),
  }),
});

export const agentRouter = createTRPCRouter({
  create: protectedProcedure
    .input(agentCreateInput)
    .mutation(async ({ ctx, input }) => {
      const agent = await db.collection("agents").insertOne({
        ...input,
        userId: ctx.session.user.id,
        organizationId: ctx.session.user.organizationId,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
        totalAttacks: 0,
      });

      return { id: agent.insertedId, ...input };
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    const agents = await db
      .collection("agents")
      .find({
        organizationId: ctx.session.user.organizationId,
        status: { $ne: "archived" },
      })
      .sort({ createdAt: -1 })
      .toArray();

    return agents;
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const agent = await db.collection("agents").findOne({
        _id: new ObjectId(input.id),
        organizationId: ctx.session.user.organizationId,
      });

      if (!agent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Agent not found",
        });
      }

      return agent;
    }),
});
```

### Attack Scenarios Router
```typescript
// src/server/api/routers/attackScenarios.ts
export const attackScenariosRouter = createTRPCRouter({
  getPublicScenarios: protectedProcedure.query(async () => {
    return await db
      .collection("attackScenarios")
      .find({ isPublic: true })
      .sort({ createdAt: -1 })
      .toArray();
  }),

  getByCategory: protectedProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ ctx, input }) => {
      return await db
        .collection("attackScenarios")
        .find({
          $or: [
            { isPublic: true },
            { organizationId: ctx.session.user.organizationId },
          ],
          category: input.category,
        })
        .toArray();
    }),

  create: protectedProcedure
    .input(attackScenarioInput)
    .mutation(async ({ ctx, input }) => {
      const scenario = await db.collection("attackScenarios").insertOne({
        ...input,
        createdBy: ctx.session.user.id,
        organizationId: ctx.session.user.organizationId,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return { id: scenario.insertedId, ...input };
    }),
});
```

### Test Runs Router
```typescript
// src/server/api/routers/testRuns.ts
export const testRunsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        agentId: z.string(),
        name: z.string(),
        attackScenarios: z.array(z.string()),
        config: z.object({
          batchSize: z.number().default(10),
          timeout: z.number().default(30000),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create test run
      const testRun = await db.collection("testRuns").insertOne({
        ...input,
        userId: ctx.session.user.id,
        organizationId: ctx.session.user.organizationId,
        status: "queued",
        startTime: new Date(),
        progress: {
          total: input.attackScenarios.length,
          completed: 0,
          failed: 0,
          successRate: 0,
        },
        createdAt: new Date(),
      });

      // Queue background job to execute attacks
      await queueAttackExecution(testRun.insertedId);

      return { id: testRun.insertedId };
    }),

  getResults: protectedProcedure
    .input(z.object({ testRunId: z.string() }))
    .query(async ({ ctx, input }) => {
      const results = await db
        .collection("attackResults")
        .find({
          testRunId: new ObjectId(input.testRunId),
          organizationId: ctx.session.user.organizationId,
        })
        .sort({ timestamp: -1 })
        .toArray();

      return results;
    }),

  getAnalytics: protectedProcedure
    .input(
      z.object({
        agentId: z.string().optional(),
        dateRange: z.object({
          start: z.date(),
          end: z.date(),
        }),
      })
    )
    .query(async ({ ctx, input }) => {
      const pipeline = [
        {
          $match: {
            organizationId: ctx.session.user.organizationId,
            timestamp: {
              $gte: input.dateRange.start,
              $lte: input.dateRange.end,
            },
            ...(input.agentId && { agentId: new ObjectId(input.agentId) }),
          },
        },
        {
          $group: {
            _id: null,
            totalAttacks: { $sum: 1 },
            successfulAttacks: {
              $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] },
            },
            averageRiskScore: { $avg: "$confidenceScore" },
            attacksByType: {
              $push: {
                $mergeObjects: [
                  { $arrayElemAt: ["$attackScenario", 0] },
                  { status: "$status" },
                ],
              },
            },
          },
        },
      ];

      const results = await db
        .collection("attackResults")
        .aggregate(pipeline)
        .toArray();

      return results[0] || null;
    }),
});
```

## 4. Database Connection Setup

```typescript
// src/server/db.ts
import { MongoClient } from "mongodb";
import { env } from "~/env";

if (!env.MONGODB_URL) {
  throw new Error("MONGODB_URL is not defined");
}

const client = new MongoClient(env.MONGODB_URL);

// Export database instance
export const db = client.db();

// Connection management
let isConnected = false;

export async function connectToDatabase() {
  if (!isConnected) {
    await client.connect();
    isConnected = true;
    console.log("Connected to MongoDB");
  }
  return db;
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  await client.close();
  isConnected = false;
});
```

## 5. Auth0 Integration for User Management

```typescript
// src/server/api/trpc.ts (update createTRPCContext)
export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts;
  const session = await getSession(req, res);

  // If user is authenticated, ensure they exist in MongoDB
  if (session?.user) {
    const existingUser = await db.collection("users").findOne({
      auth0Id: session.user.sub,
    });

    if (!existingUser) {
      // Create user in MongoDB
      await db.collection("users").insertOne({
        auth0Id: session.user.sub,
        email: session.user.email,
        name: session.user.name,
        role: "analyst",
        organizationId: new ObjectId(), // Create or assign organization
        createdAt: new Date(),
        lastActive: new Date(),
      });
    } else {
      // Update last active
      await db.collection("users").updateOne(
        { auth0Id: session.user.sub },
        { $set: { lastActive: new Date() } }
      );
    }
  }

  return {
    session,
    db,
  };
};
```

## 6. Background Job Processing

For attack execution, use a simple queue system:

```typescript
// src/server/jobs/attackExecution.ts
import { ObjectId } from "mongodb";
import { db } from "~/server/db";

export async function queueAttackExecution(testRunId: ObjectId) {
  // In a real app, use a proper queue like Bull or Agenda
  // For hackathon, simple setTimeout works
  setTimeout(() => executeAttacks(testRunId), 1000);
}

async function executeAttacks(testRunId: ObjectId) {
  const testRun = await db.collection("testRuns").findOne({ _id: testRunId });
  if (!testRun) return;

  await db.collection("testRuns").updateOne(
    { _id: testRunId },
    { $set: { status: "running" } }
  );

  // Execute attacks sequentially
  for (const scenarioId of testRun.attackScenarios) {
    await executeAttack(testRunId, new ObjectId(scenarioId));
  }

  await db.collection("testRuns").updateOne(
    { _id: testRunId },
    { $set: { status: "completed", endTime: new Date() } }
  );
}

async function executeAttack(testRunId: ObjectId, scenarioId: ObjectId) {
  // Fetch scenario and agent details
  // Make API call to AI model
  // Store result in attackResults collection
  // Update progress in testRuns collection
}
```

This gives you a solid foundation to build on while competing for multiple sponsor prizes!