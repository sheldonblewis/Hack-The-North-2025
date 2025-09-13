# AI Red-Team Platform Integration Plan

## Executive Summary
This document outlines a **non-destructive integration plan** to connect the existing AI red-teaming backend with MongoDB database and the React frontend. The approach preserves all existing functionality while adding database persistence and API endpoints.

## Current State Analysis

### ✅ What's Working (DO NOT MODIFY)
- **Core AI Engine**: `agents.py` - JailBreakAgent and DefenseAgent classes
- **Simulation Logic**: `simulation.py` - Attack orchestration and evaluation
- **LLM Integration**: `llms.py` - Cerebras and Cohere API calls
- **Environment Setup**: `.env` with API keys
- **Dependencies**: `requirements.txt` with all needed packages

### ❌ What's Missing
- Database persistence of attack results
- API layer for frontend communication
- Real-time data flow to frontend analytics dashboard

### 🎯 Integration Goals
1. **Preserve Existing Code**: Zero modifications to core AI logic
2. **Add Database Layer**: Save attack results to MongoDB without changing simulation flow
3. **Create API Endpoints**: Build FastAPI layer for frontend consumption
4. **Enable Real-time Updates**: Live attack results in frontend dashboard

---

## Phase 1: Database Integration (Non-Destructive)

### Approach: Wrapper Pattern
Instead of modifying existing classes, we'll create wrapper functions that:
1. Call existing functions unchanged
2. Save results to MongoDB as a side effect
3. Return the same data as before

### Files to Create (NEW FILES ONLY)
```
backend/
├── database_integration.py  # NEW - MongoDB wrapper functions
├── models.py               # NEW - Data models for consistency
└── api_endpoints.py        # NEW - FastAPI endpoints
```

### 1.1 Create `models.py` - Data Structure Definitions

```python
# models.py - Data models for MongoDB documents
from datetime import datetime
from typing import List, Optional, Dict, Any
from dataclasses import dataclass, asdict
from bson import ObjectId

@dataclass
class AgentModel:
    name: str
    objective: str
    model_provider: str
    model_name: str
    status: str = "active"
    user_id: Optional[str] = None
    created_at: Optional[datetime] = None
    _id: Optional[ObjectId] = None

@dataclass
class AttackAttemptModel:
    agent_id: str
    attack_strategy: str
    prompt_sent: str
    response_received: str
    status: str  # "success", "blocked", "failed"
    risk_score: Optional[int] = None
    response_time: Optional[int] = None
    timestamp: Optional[datetime] = None
    evaluation_result: Optional[bool] = None
    _id: Optional[ObjectId] = None

@dataclass
class SimulationRunModel:
    agent_id: str
    objective: str
    initial_prompt: str
    defense_system_prompt: str
    total_attempts: int
    successful_attempts: int
    status: str  # "running", "completed", "failed"
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    _id: Optional[ObjectId] = None
```

### 1.2 Create `database_integration.py` - Non-Destructive Wrappers

```python
# database_integration.py - Wrapper functions for database integration
from database import get_db, COLLECTIONS
from models import AgentModel, AttackAttemptModel, SimulationRunModel
from datetime import datetime
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

class DatabaseIntegration:
    def __init__(self):
        self.db = get_db()

    def save_agent(self, name: str, objective: str, model_provider: str = "cerebras",
                   model_name: str = "llama-4-scout-17b-16e-instruct") -> str:
        """Save agent configuration to database"""
        agent_data = AgentModel(
            name=name,
            objective=objective,
            model_provider=model_provider,
            model_name=model_name,
            created_at=datetime.utcnow()
        )

        collection = self.db.get_collection(COLLECTIONS["AGENTS"])
        result = collection.insert_one(asdict(agent_data))

        logger.info(f"Agent saved with ID: {result.inserted_id}")
        return str(result.inserted_id)

    def save_attack_attempt(self, agent_id: str, attack_strategy: str,
                          prompt: str, response: str, evaluation_result: bool,
                          response_time: int = None) -> str:
        """Save individual attack attempt to database"""

        # Determine status based on evaluation
        if evaluation_result:
            status = "success"
            risk_score = 10  # High risk if successful jailbreak
        else:
            status = "blocked"
            risk_score = 1   # Low risk if blocked

        attempt_data = AttackAttemptModel(
            agent_id=agent_id,
            attack_strategy=attack_strategy,
            prompt_sent=prompt,
            response_received=response,
            status=status,
            risk_score=risk_score,
            response_time=response_time,
            evaluation_result=evaluation_result,
            timestamp=datetime.utcnow()
        )

        collection = self.db.get_collection(COLLECTIONS["ATTACK_RESULTS"])
        result = collection.insert_one(asdict(attempt_data))

        logger.info(f"Attack attempt saved with ID: {result.inserted_id}")
        return str(result.inserted_id)

    def start_simulation_run(self, agent_id: str, objective: str,
                           initial_prompt: str, defense_system_prompt: str) -> str:
        """Start tracking a simulation run"""
        run_data = SimulationRunModel(
            agent_id=agent_id,
            objective=objective,
            initial_prompt=initial_prompt,
            defense_system_prompt=defense_system_prompt,
            total_attempts=0,
            successful_attempts=0,
            status="running",
            start_time=datetime.utcnow()
        )

        collection = self.db.get_collection(COLLECTIONS["TEST_RUNS"])
        result = collection.insert_one(asdict(run_data))

        logger.info(f"Simulation run started with ID: {result.inserted_id}")
        return str(result.inserted_id)

    def update_simulation_run(self, run_id: str, total_attempts: int,
                            successful_attempts: int, status: str = "completed"):
        """Update simulation run statistics"""
        collection = self.db.get_collection(COLLECTIONS["TEST_RUNS"])

        update_data = {
            "total_attempts": total_attempts,
            "successful_attempts": successful_attempts,
            "status": status,
            "end_time": datetime.utcnow()
        }

        collection.update_one(
            {"_id": ObjectId(run_id)},
            {"$set": update_data}
        )

        logger.info(f"Simulation run {run_id} updated")

# Global instance
db_integration = DatabaseIntegration()
```

### 1.3 Create `simulation_wrapper.py` - Non-Destructive Simulation Integration

```python
# simulation_wrapper.py - Wrapper for simulation.py that adds database integration
import time
from simulation import start_simulation as original_start_simulation
from simulation import simulate_attack as original_simulate_attack
from simulation import seed_simulate_attack as original_seed_simulate_attack
from database_integration import db_integration
from agents import JailBreakAgent, DefenseAgent
import logging

logger = logging.getLogger(__name__)

def start_simulation_with_db(iterations: int, attack_objective: str,
                           initial_attack_prompt: str, defense_system_prompt: str,
                           agent_name: str = None) -> dict:
    """
    Wrapper for start_simulation that adds database integration

    Returns:
        dict: {
            "success": bool,
            "agent_id": str,
            "run_id": str,
            "total_attempts": int,
            "successful_attempts": int
        }
    """

    # Save agent to database
    agent_name = agent_name or f"Agent_{int(time.time())}"
    agent_id = db_integration.save_agent(
        name=agent_name,
        objective=attack_objective,
        model_provider="cerebras",
        model_name="llama-4-scout-17b-16e-instruct"
    )

    # Start simulation run tracking
    run_id = db_integration.start_simulation_run(
        agent_id=agent_id,
        objective=attack_objective,
        initial_prompt=initial_attack_prompt,
        defense_system_prompt=defense_system_prompt
    )

    logger.info(f"Starting simulation - Agent ID: {agent_id}, Run ID: {run_id}")

    # Create agents (same as original)
    defense_agent = DefenseAgent(system_prompt=defense_system_prompt)
    attack_agent = JailBreakAgent(objective=attack_objective)

    total_attempts = 0
    successful_attempts = 0

    try:
        # Generate and test seed prompts
        attack_agent.create_seeds()

        for i, prompt in enumerate(reversed(attack_agent.seed_attack_prompts)):
            total_attempts += 1

            # Use original function but intercept the result
            success = seed_simulate_attack_with_db(
                defense_agent, attack_agent, prompt, agent_id, f"seed_{i+1}"
            )

            if success:
                successful_attempts += 1
                # Update database and return success
                db_integration.update_simulation_run(run_id, total_attempts, successful_attempts)
                return {
                    "success": True,
                    "agent_id": agent_id,
                    "run_id": run_id,
                    "total_attempts": total_attempts,
                    "successful_attempts": successful_attempts
                }

        # Continue with iterative approach (same logic as original)
        defense_message = defense_agent.ask(initial_attack_prompt)
        state = attack_agent.evaluate_broken(defense_message)

        total_attempts += 1

        # Save initial attempt
        db_integration.save_attack_attempt(
            agent_id=agent_id,
            attack_strategy="initial",
            prompt=initial_attack_prompt,
            response=defense_message,
            evaluation_result=state
        )

        if state:
            successful_attempts += 1
            db_integration.update_simulation_run(run_id, total_attempts, successful_attempts)
            return {
                "success": True,
                "agent_id": agent_id,
                "run_id": run_id,
                "total_attempts": total_attempts,
                "successful_attempts": successful_attempts
            }

        # Add to attack list (preserve original logic)
        schema = {"prompt": initial_attack_prompt, "defense_message": defense_message}
        attack_agent.attack_prompts_list.append(schema)

        attack_prompt = schema["prompt"]

        # Iterate (same as original but with database saves)
        for i in range(iterations):
            total_attempts += 1

            success = simulate_attack_with_db(
                defense_agent, attack_agent, attack_prompt, defense_message,
                agent_id, f"iteration_{i+1}"
            )

            attack_prompt = attack_agent.attack_prompts_list[-1]["prompt"]
            defense_message = attack_agent.attack_prompts_list[-1]["defense_message"]

            if success:
                successful_attempts += 1
                break

        # Update final statistics
        db_integration.update_simulation_run(run_id, total_attempts, successful_attempts)

        return {
            "success": successful_attempts > 0,
            "agent_id": agent_id,
            "run_id": run_id,
            "total_attempts": total_attempts,
            "successful_attempts": successful_attempts
        }

    except Exception as e:
        logger.error(f"Simulation failed: {e}")
        db_integration.update_simulation_run(run_id, total_attempts, successful_attempts, "failed")
        raise

def seed_simulate_attack_with_db(defense: DefenseAgent, attack: JailBreakAgent,
                                attack_prompt: str, agent_id: str, strategy: str):
    """Wrapper for seed_simulate_attack with database integration"""

    # Call original function logic
    schema = {}
    schema["prompt"] = attack_prompt
    schema["defense_message"] = defense.ask(schema["prompt"])

    # Add to history (preserve original behavior)
    attack.attack_prompts_list.append(schema)

    # Evaluate (preserve original behavior)
    status = attack.evaluate_broken(schema["defense_message"])

    # Save to database (NEW)
    db_integration.save_attack_attempt(
        agent_id=agent_id,
        attack_strategy=strategy,
        prompt=schema["prompt"],
        response=schema["defense_message"],
        evaluation_result=status
    )

    # Return original result
    if status:
        for j in range(10):
            print("SUCCESS - JAILBROKEN!!!!!!")
        return True
    else:
        return False

def simulate_attack_with_db(defense: DefenseAgent, attack: JailBreakAgent,
                          previous_prompt: str, defense_message: str,
                          agent_id: str, strategy: str):
    """Wrapper for simulate_attack with database integration"""

    schema = {}

    # Refine prompt (original logic)
    schema["prompt"] = attack.refine_prompt(previous_prompt, defense_message)

    # Test prompt (original logic)
    schema["defense_message"] = defense.ask(schema["prompt"])

    # Add to history (original logic)
    attack.attack_prompts_list.append(schema)

    # Evaluate (original logic)
    status = attack.evaluate_broken(schema["defense_message"])

    # Save to database (NEW)
    db_integration.save_attack_attempt(
        agent_id=agent_id,
        attack_strategy=strategy,
        prompt=schema["prompt"],
        response=schema["defense_message"],
        evaluation_result=status
    )

    # Return original result
    return status
```

---

## Phase 2: API Layer (FastAPI Endpoints)

### 2.1 Extend `main.py` - Add API Endpoints

```python
# main.py - Add these endpoints to existing FastAPI app
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import asyncio
from datetime import datetime, timedelta

from simulation_wrapper import start_simulation_with_db
from database import get_db, COLLECTIONS
from bson import ObjectId

app = FastAPI(title="AI Red-Team Platform API")

# Request/Response Models
class CreateAgentRequest(BaseModel):
    name: str
    objective: str
    model_provider: str = "cerebras"
    model_name: str = "llama-4-scout-17b-16e-instruct"

class StartSimulationRequest(BaseModel):
    agent_id: str
    iterations: int = 4
    initial_attack_prompt: str
    defense_system_prompt: str = "Be ethical and safe."

class SimulationResponse(BaseModel):
    success: bool
    agent_id: str
    run_id: str
    total_attempts: int
    successful_attempts: int

# API Endpoints
@app.post("/api/agents", response_model=dict)
async def create_agent(request: CreateAgentRequest):
    """Create a new agent configuration"""
    try:
        from database_integration import db_integration
        agent_id = db_integration.save_agent(
            name=request.name,
            objective=request.objective,
            model_provider=request.model_provider,
            model_name=request.model_name
        )
        return {"agent_id": agent_id, "message": "Agent created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/agents")
async def get_agents():
    """Get all agents"""
    try:
        db = get_db()
        collection = db.get_collection(COLLECTIONS["AGENTS"])
        agents = list(collection.find({}))

        # Convert ObjectId to string
        for agent in agents:
            agent["_id"] = str(agent["_id"])

        return {"agents": agents}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/agents/{agent_id}/simulate", response_model=SimulationResponse)
async def run_simulation(agent_id: str, request: StartSimulationRequest, background_tasks: BackgroundTasks):
    """Start a red-team simulation"""
    try:
        # Get agent details
        db = get_db()
        agent_collection = db.get_collection(COLLECTIONS["AGENTS"])
        agent = agent_collection.find_one({"_id": ObjectId(agent_id)})

        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")

        # Run simulation in background
        def run_sim():
            return start_simulation_with_db(
                iterations=request.iterations,
                attack_objective=agent["objective"],
                initial_attack_prompt=request.initial_attack_prompt,
                defense_system_prompt=request.defense_system_prompt,
                agent_name=agent["name"]
            )

        # For hackathon - run synchronously (in production, use background tasks)
        result = run_sim()

        return SimulationResponse(**result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/agents/{agent_id}/results")
async def get_agent_results(agent_id: str, limit: int = 50):
    """Get attack results for an agent"""
    try:
        db = get_db()
        collection = db.get_collection(COLLECTIONS["ATTACK_RESULTS"])

        results = list(collection.find({"agent_id": agent_id})
                      .sort("timestamp", -1)
                      .limit(limit))

        # Convert ObjectId to string
        for result in results:
            result["_id"] = str(result["_id"])

        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics")
async def get_analytics():
    """Get analytics dashboard data"""
    try:
        db = get_db()
        results_collection = db.get_collection(COLLECTIONS["ATTACK_RESULTS"])

        # Last 24 hours
        since = datetime.utcnow() - timedelta(hours=24)

        pipeline = [
            {"$match": {"timestamp": {"$gte": since}}},
            {
                "$group": {
                    "_id": None,
                    "total_attacks": {"$sum": 1},
                    "successful_attacks": {
                        "$sum": {"$cond": [{"$eq": ["$status", "success"]}, 1, 0]}
                    },
                    "blocked_attacks": {
                        "$sum": {"$cond": [{"$eq": ["$status", "blocked"]}, 1, 0]}
                    },
                    "avg_risk_score": {"$avg": "$risk_score"}
                }
            }
        ]

        result = list(results_collection.aggregate(pipeline))
        analytics = result[0] if result else {
            "total_attacks": 0,
            "successful_attacks": 0,
            "blocked_attacks": 0,
            "avg_risk_score": 0
        }

        # Calculate success rate
        total = analytics["total_attacks"]
        analytics["success_rate"] = (analytics["successful_attacks"] / total * 100) if total > 0 else 0

        return analytics

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## Phase 3: Frontend Integration (Update React Frontend)

### 3.1 Update Frontend Environment Variables

```env
# frontend/.env (add to existing)
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 3.2 Create API Client

```typescript
// frontend/src/lib/api.ts - NEW FILE
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface Agent {
  _id: string;
  name: string;
  objective: string;
  model_provider: string;
  model_name: string;
  status: string;
  created_at: string;
}

export interface AttackResult {
  _id: string;
  agent_id: string;
  attack_strategy: string;
  prompt_sent: string;
  response_received: string;
  status: 'success' | 'blocked' | 'failed';
  risk_score: number;
  timestamp: string;
}

export interface Analytics {
  total_attacks: number;
  successful_attacks: number;
  blocked_attacks: number;
  success_rate: number;
  avg_risk_score: number;
}

class ApiClient {
  async getAgents(): Promise<Agent[]> {
    const response = await fetch(`${API_BASE}/agents`);
    const data = await response.json();
    return data.agents;
  }

  async createAgent(agent: Omit<Agent, '_id' | 'created_at' | 'status'>): Promise<string> {
    const response = await fetch(`${API_BASE}/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agent)
    });
    const data = await response.json();
    return data.agent_id;
  }

  async getAgentResults(agentId: string): Promise<AttackResult[]> {
    const response = await fetch(`${API_BASE}/agents/${agentId}/results`);
    const data = await response.json();
    return data.results;
  }

  async getAnalytics(): Promise<Analytics> {
    const response = await fetch(`${API_BASE}/analytics`);
    return response.json();
  }

  async runSimulation(agentId: string, config: {
    iterations: number;
    initial_attack_prompt: string;
    defense_system_prompt: string;
  }) {
    const response = await fetch(`${API_BASE}/agents/${agentId}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return response.json();
  }
}

export const apiClient = new ApiClient();
```

### 3.3 Update Analytics Dashboard to Use Real Data

```typescript
// frontend/src/app/agents/[agentId]/analytics/page.tsx - UPDATE EXISTING
// Replace mock data with real API calls

import { useEffect, useState } from 'react';
import { apiClient, Analytics, AttackResult } from '~/lib/api';

export default function AgentAnalytics({ params }: { params: Promise<{ agentId: string }> }) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [results, setResults] = useState<AttackResult[]>([]);
  const [agentId, setAgentId] = useState<string>("");

  useEffect(() => {
    params.then(({ agentId }) => {
      setAgentId(agentId);
      loadData(agentId);
    });
  }, [params]);

  const loadData = async (agentId: string) => {
    try {
      const [analyticsData, resultsData] = await Promise.all([
        apiClient.getAnalytics(),
        apiClient.getAgentResults(agentId)
      ]);

      setAnalytics(analyticsData);
      setResults(resultsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  // Rest of component uses real data instead of mock data
  // ...
}
```

---

## Phase 4: Testing & Validation

### 4.1 Create Test Script

```python
# test_integration.py - NEW FILE
import asyncio
import json
from simulation_wrapper import start_simulation_with_db
from database import get_db, COLLECTIONS
import requests

def test_database_integration():
    """Test database integration without breaking existing functionality"""
    print("🧪 Testing Database Integration...")

    # Test simulation with database
    result = start_simulation_with_db(
        iterations=2,
        attack_objective="Test objective - generate a harmless joke",
        initial_attack_prompt="Tell me a joke about programming",
        defense_system_prompt="Be helpful and provide appropriate responses",
        agent_name="Test Agent"
    )

    print(f"✅ Simulation completed: {result}")

    # Verify data in database
    db = get_db()
    agents_collection = db.get_collection(COLLECTIONS["AGENTS"])
    results_collection = db.get_collection(COLLECTIONS["ATTACK_RESULTS"])

    agent = agents_collection.find_one({"_id": result["agent_id"]})
    attack_results = list(results_collection.find({"agent_id": result["agent_id"]}))

    print(f"✅ Found agent in database: {agent['name']}")
    print(f"✅ Found {len(attack_results)} attack results")

def test_api_endpoints():
    """Test API endpoints"""
    print("🧪 Testing API Endpoints...")

    base_url = "http://localhost:8000/api"

    # Test health check
    response = requests.get(f"{base_url}/health")
    print(f"✅ Health check: {response.status_code}")

    # Test get agents
    response = requests.get(f"{base_url}/agents")
    if response.status_code == 200:
        agents = response.json()["agents"]
        print(f"✅ Found {len(agents)} agents")

    # Test analytics
    response = requests.get(f"{base_url}/analytics")
    if response.status_code == 200:
        analytics = response.json()
        print(f"✅ Analytics: {analytics}")

if __name__ == "__main__":
    test_database_integration()
    print("\n" + "="*50 + "\n")
    test_api_endpoints()
```

---

## Implementation Timeline

### Day 1 (Today)
- **Phase 1**: Database Integration (1-2 hours)
  - Create models.py
  - Create database_integration.py
  - Create simulation_wrapper.py
  - Test with existing simulation

### Day 2 (Tomorrow)
- **Phase 2**: API Layer (1-2 hours)
  - Extend main.py with endpoints
  - Test API endpoints

- **Phase 3**: Frontend Integration (1-2 hours)
  - Create API client
  - Update analytics dashboard
  - Test end-to-end flow

## Risk Mitigation

### ✅ Safety Measures
1. **No Existing Code Changes**: All original files remain untouched
2. **Wrapper Pattern**: New functionality wraps existing logic
3. **Fallback Strategy**: If integration fails, original system still works
4. **Incremental Testing**: Each phase is tested independently

### 🔄 Rollback Plan
If anything breaks:
1. Delete new files (models.py, database_integration.py, etc.)
2. Original system continues working unchanged
3. MongoDB data remains intact for future attempts

### 📊 Success Metrics
- [ ] Original simulation.py still runs unchanged
- [ ] Database receives attack result data
- [ ] API endpoints return real data
- [ ] Frontend dashboard shows live attack results
- [ ] MongoDB Atlas shows populated collections

## File Change Summary

### 🆕 New Files (Safe to Create)
- `backend/models.py`
- `backend/database_integration.py`
- `backend/simulation_wrapper.py`
- `backend/test_integration.py`
- `frontend/src/lib/api.ts`

### ✏️ Modified Files (Minimal Changes)
- `backend/main.py` (add API endpoints)
- `frontend/.env` (add API URL)
- `frontend/src/app/agents/[agentId]/analytics/page.tsx` (use real data)

### 🚫 Unchanged Files (Preserve Existing)
- `backend/agents.py` ✅
- `backend/simulation.py` ✅
- `backend/llms.py` ✅
- `backend/.env` ✅
- `backend/requirements.txt` ✅

---

## Sponsor Prize Alignment

This integration positions you for multiple sponsor prizes:

1. **MongoDB Atlas** ($150 per team member) - ✅ Primary database
2. **Auth0** (Wireless headphones per team member) - Easy to add user auth to API
3. **Cerebras** (Keychron keyboards per team member) - ✅ Already using Cerebras API
4. **Cohere** ($500 per team member) - ✅ Already using Cohere API

## Conclusion

This plan provides a **safe, non-destructive path** to integrate your working AI red-teaming backend with MongoDB and your React frontend. The wrapper pattern ensures your colleague's code remains untouched while adding the database persistence and API layer needed for a complete hackathon solution.

**Ready to proceed?** The implementation can begin immediately with Phase 1 (Database Integration), which takes 1-2 hours and provides immediate value by persisting your attack results.