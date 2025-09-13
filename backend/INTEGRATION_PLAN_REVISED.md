# AI Red-Team Platform Integration Plan - REVISED

## ❌ Issues Found in Original Plan

### 1. **Missing FastAPI Setup**
Original plan assumes `main.py` exists with FastAPI. Need to create from scratch.

### 2. **Frontend Architecture Mismatch**
- Current: Next.js + tRPC + Prisma
- Plan suggests: REST API endpoints
- **Fix**: Use tRPC procedures instead of REST endpoints

### 3. **Critical Bug in simulation.py:85**
```python
# BUG: state is never updated in the loop
if state == True:  # ← This will never change
```
**Fix**: Update `state = simulate_attack(...)` result in loop

### 4. **Missing Environment Setup**
Need to create `.env` files for both backend and frontend with proper MongoDB Atlas connections.

### 5. **Dependencies Missing**
- FastAPI, uvicorn for backend API
- Proper CORS setup for frontend communication

## 🔧 **CORRECTED Implementation Plan**

### Phase 1: Fix Core Issues (REQUIRED FIRST)

#### 1.1 Fix simulation.py Logic Bug
```python
# In simulation.py:79-89, fix the infinite loop:
for i in range(iterations):
    success = simulate_attack(defense_agent, attack_agent, attack_prompt, defense_message)

    attack_prompt = attack_agent.attack_prompts_list[-1]["prompt"]
    defense_message = attack_agent.attack_prompts_list[-1]["defense_message"]

    if success:  # ← Fix: use the return value, not the old state variable
        for j in range(10):
            print("SUCCESS - JAILBROKEN in ", i, " tries!!!!!!")
        return True
```

#### 1.2 Create Missing Backend API (main.py)
```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from simulation_wrapper import start_simulation_with_db

app = FastAPI(title="AI Red-Team Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add the endpoints from original plan here...
```

#### 1.3 Create Environment Files
```bash
# backend/.env
MONGODB_URI=mongodb+srv://your-connection-string
MONGODB_DB_NAME=ai-redteam
CEREBRAS_API_KEY=your-key
COHERE_API_KEY=your-key
```

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
MONGODB_URI=your-connection-string  # For tRPC if needed
```

#### 1.4 Update requirements.txt
```txt
# Add to existing requirements.txt:
fastapi==0.104.1
uvicorn==0.24.0
python-multipart==0.0.6
```

### Phase 2: Integration Approach - Choose One

#### Option A: REST API (Original Plan)
- Create FastAPI backend as planned
- Update frontend to use fetch() instead of tRPC
- Simpler but requires more frontend changes

#### Option B: tRPC Integration (Recommended)
- Keep existing tRPC structure in frontend
- Add tRPC router procedures for simulation functions
- Minimal frontend changes required

**Recommendation: Option B** - Less disruptive to existing frontend

### Phase 3: tRPC Integration Implementation

#### 3.1 Create Backend tRPC Router
```python
# backend/trpc_integration.py - NEW
from simulation_wrapper import start_simulation_with_db
import json

def create_simulation_endpoint():
    """Create simulation function callable from tRPC"""
    def run_simulation(objective: str, initial_prompt: str, defense_prompt: str = "Be ethical and safe."):
        try:
            result = start_simulation_with_db(
                iterations=4,
                attack_objective=objective,
                initial_attack_prompt=initial_prompt,
                defense_system_prompt=defense_prompt,
                agent_name=f"Agent_{int(time.time())}"
            )
            return result
        except Exception as e:
            return {"error": str(e), "success": False}

    return run_simulation
```

#### 3.2 Update Frontend tRPC Router
```typescript
// frontend/src/server/api/routers/agents.ts - UPDATE EXISTING
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const agentsRouter = createTRPCRouter({
  // Add to existing procedures:
  runSimulation: publicProcedure
    .input(z.object({
      objective: z.string(),
      initialPrompt: z.string(),
      defensePrompt: z.string().default("Be ethical and safe."),
    }))
    .mutation(async ({ input }) => {
      // Call Python backend via subprocess or API
      const response = await fetch('http://localhost:8000/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      return response.json();
    }),
});
```

## 🚦 **Readiness Assessment**

### ✅ **Ready to Implement:**
- Database models and integration
- Core AI logic (after bug fix)
- MongoDB connection structure

### ⚠️ **Needs Work Before Implementation:**
- Fix simulation.py infinite loop bug
- Choose integration approach (REST vs tRPC)
- Set up environment variables
- Add missing dependencies

### ❌ **Blockers:**
- Critical bug in simulation loop must be fixed first
- Need MongoDB Atlas connection string
- Missing API framework setup

## 🎯 **Recommendation**

**DO NOT PROCEED** with original plan until:

1. **Fix the simulation.py bug** (5 minutes)
2. **Choose integration strategy** (REST vs tRPC)
3. **Set up MongoDB Atlas** and get connection string
4. **Create missing .env files**
5. **Add FastAPI dependencies**

**Estimated time to ready**: 30-45 minutes of prep work

Would you like me to:
1. Fix the simulation.py bug immediately
2. Help you choose the best integration approach
3. Set up the missing environment files
4. Implement the corrected version step by step

**The core concept is solid, but these foundational issues must be addressed first.**