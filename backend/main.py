from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import asyncio
from datetime import datetime

# Import our simulation and database integration
from simulation_wrapper import start_simulation_with_db
from database_integration import db_integration
from database import get_db, COLLECTIONS
from bson import ObjectId

# Create FastAPI app
app = FastAPI(title="AI Red-Team Platform", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3002", "http://localhost:3003", "http://localhost:3004"],  # Frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "AI Red-Team Backend"
    }

# Basic info endpoint
@app.get("/")
async def root():
    """Root endpoint with API info"""
    return {
        "message": "AI Red-Team Platform API",
        "version": "1.0.0",
        "docs": "/docs"
    }

# Request/Response Models
class CreateAgentRequest(BaseModel):
    name: str
    objective: str
    model_provider: str = "cerebras"
    model_name: str = "llama-4-scout-17b-16e-instruct"

class StartSimulationRequest(BaseModel):
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
@app.post("/api/agents")
async def create_agent(request: CreateAgentRequest):
    """Create a new agent configuration"""
    try:
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
        agents = list(collection.find({}).sort("created_at", -1))

        # Convert ObjectId to string
        for agent in agents:
            agent["_id"] = str(agent["_id"])

        return {"agents": agents}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/agents/{agent_id}/simulate")
async def run_simulation(agent_id: str, request: StartSimulationRequest):
    """Start a red-team simulation"""
    try:
        # Get agent details
        db = get_db()
        agent_collection = db.get_collection(COLLECTIONS["AGENTS"])
        agent = agent_collection.find_one({"_id": ObjectId(agent_id)})

        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")

        # Run simulation (synchronous for hackathon demo)
        result = start_simulation_with_db(
            iterations=request.iterations,
            attack_objective=agent["objective"],
            initial_attack_prompt=request.initial_attack_prompt,
            defense_system_prompt=request.defense_system_prompt,
            agent_name=agent["name"]
        )

        return SimulationResponse(**result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/agents/{agent_id}/results")
async def get_agent_results(agent_id: str, limit: int = 50):
    """Get attack results for an agent"""
    try:
        results = db_integration.get_agent_results(agent_id, limit)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics")
async def get_analytics():
    """Get analytics dashboard data"""
    try:
        analytics = db_integration.get_analytics_summary()
        return analytics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/{agent_id}")
async def get_agent_analytics(agent_id: str):
    """Get analytics for a specific agent"""
    try:
        analytics = db_integration.get_analytics_summary(agent_id)
        return analytics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Run the server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)