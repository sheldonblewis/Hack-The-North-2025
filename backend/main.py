from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import asyncio
import logging
import json
from datetime import datetime

# Configure logging
logger = logging.getLogger(__name__)

# Import our simulation and database integration
from simulation_wrapper import start_simulation_with_db, start_streaming_simulation_with_db
from database_integration import db_integration
from database import get_db, COLLECTIONS
from bson import ObjectId

# Create FastAPI app
app = FastAPI(title="AI Red-Team Platform", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:3004"],  # Frontend origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Add explicit OPTIONS handlers for problematic endpoints
@app.options("/api/agents")
async def options_agents():
    return {"message": "OK"}

@app.options("/api/analytics")
async def options_analytics():
    return {"message": "OK"}

@app.options("/api/agents/{agent_id}/simulate")
async def options_simulate(agent_id: str):
    return {"message": "OK"}

@app.options("/api/agents/{agent_id}/results")
async def options_results(agent_id: str):
    return {"message": "OK"}

@app.options("/api/agents/{agent_id}/simulate/stream")
async def options_simulate_stream(agent_id: str):
    return {"message": "OK"}

@app.options("/api/analytics/{agent_id}")
async def options_agent_analytics(agent_id: str):
    return {"message": "OK"}

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
    """Get all agents - with fallback for MongoDB issues"""
    try:
        db = get_db()
        collection = db.get_collection(COLLECTIONS["AGENTS"])
        agents = list(collection.find({}).sort("created_at", -1))

        # Convert ObjectId to string
        for agent in agents:
            agent["_id"] = str(agent["_id"])

        return {"agents": agents}
    except Exception as e:
        # Fallback: Return mock agents if database fails (for testing)
        mock_agents = [
            {
                "_id": "mock_agent_1",
                "name": "Test Agent 1",
                "objective": "Test basic functionality",
                "model_provider": "cerebras",
                "model_name": "llama-4-scout-17b-16e-instruct",
                "status": "active",
                "created_at": "2025-09-13T20:00:00"
            },
            {
                "_id": "mock_agent_2",
                "name": "Security Test Agent",
                "objective": "Test security bypass scenarios",
                "model_provider": "cerebras",
                "model_name": "llama-4-scout-17b-16e-instruct",
                "status": "active",
                "created_at": "2025-09-13T19:00:00"
            }
        ]
        return {"agents": mock_agents}

@app.post("/api/agents/{agent_id}/simulate")
async def run_simulation(agent_id: str, request: StartSimulationRequest):
    """Start a red-team simulation"""
    try:
        # Handle mock agents
        if agent_id.startswith("mock_agent_"):
            from agents import JailBreakAgent, DefenseAgent

            # Use mock agent data
            agent_name = "Test Agent" if agent_id == "mock_agent_1" else "Security Test Agent"
            objective = "Test basic functionality" if agent_id == "mock_agent_1" else "Test security bypass scenarios"

            # Run simulation without database (direct test)
            defense_agent = DefenseAgent(system_prompt=request.defense_system_prompt)
            attack_agent = JailBreakAgent(objective=objective)

            # Test user's attack prompt directly (skip seeds as fixed)
            defense_message = defense_agent.ask(request.initial_attack_prompt)
            evaluation_result = attack_agent.evaluate_broken(defense_message)

            return SimulationResponse(
                success=True,
                agent_id=agent_id,
                run_id=f"mock_run_{agent_id}",
                total_attempts=1,
                successful_attempts=1 if evaluation_result else 0
            )

        # Get agent details from database (original logic)
        db = get_db()
        agent_collection = db.get_collection(COLLECTIONS["AGENTS"])
        agent = agent_collection.find_one({"_id": ObjectId(agent_id)})

        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")

        # Run simulation with database (original logic)
        result = start_simulation_with_db(
            iterations=request.iterations,
            attack_objective=agent["objective"],
            initial_attack_prompt=request.initial_attack_prompt,
            defense_system_prompt=request.defense_system_prompt,
            agent_name=agent["name"]
        )

        return SimulationResponse(**result)

    except Exception as e:
        logger.error(f"Simulation failed for agent {agent_id}: {e}")
        # Check if this is a context length error with user-friendly message
        if hasattr(e, 'args') and len(e.args) > 0 and isinstance(e.args[0], dict):
            error_data = e.args[0]
            if 'error' in error_data:
                raise HTTPException(status_code=400, detail=error_data['error'])
        raise HTTPException(status_code=500, detail="Simulation failed. Please check your inputs and try again.")

@app.post("/api/agents/{agent_id}/simulate/stream")
async def run_streaming_simulation(agent_id: str, request: StartSimulationRequest):
    """Start a streaming red-team simulation with real-time updates"""

    def generate_streaming_response():
        try:
            # Handle mock agents with simple mock streaming
            if agent_id.startswith("mock_agent_"):
                from agents import JailBreakAgent, DefenseAgent

                # Use mock agent data
                agent_name = "Test Agent" if agent_id == "mock_agent_1" else "Security Test Agent"
                objective = "Test basic functionality" if agent_id == "mock_agent_1" else "Test security bypass scenarios"

                # Send initial status
                yield f"data: {json.dumps({'type': 'progress', 'data': {'state': 'starting', 'agent_id': agent_id}})}\n\n"

                # Run simulation without database (direct test)
                defense_agent = DefenseAgent(system_prompt=request.defense_system_prompt)
                attack_agent = JailBreakAgent(objective=objective)

                # Send generating status
                yield f"data: {json.dumps({'type': 'progress', 'data': {'state': 'generating', 'agent_id': agent_id}})}\n\n"

                # Test user's attack prompt directly
                defense_message = defense_agent.ask(request.initial_attack_prompt)
                evaluation_result = attack_agent.evaluate_broken(defense_message)

                # Send conversation
                conversation_data = {
                    'type': 'progress',
                    'data': {
                        'state': 'generating',
                        'conversation_history': [
                            {'attack_prompt': request.initial_attack_prompt},
                            {'defense_message': defense_message}
                        ],
                        'agent_id': agent_id
                    }
                }
                yield f"data: {json.dumps(conversation_data)}\n\n"

                # Send final result
                final_result = {
                    "type": "complete",
                    "data": {
                        "success": True,
                        "agent_id": agent_id,
                        "run_id": f"mock_run_{agent_id}",
                        "total_attempts": 1,
                        "successful_attempts": 1 if evaluation_result else 0
                    }
                }
                yield f"data: {json.dumps(final_result)}\n\n"
                return

            # Get agent details from database (real agent logic)
            from database import get_db, COLLECTIONS
            from bson import ObjectId

            db = get_db()
            agent_collection = db.get_collection(COLLECTIONS["AGENTS"])
            agent = agent_collection.find_one({"_id": ObjectId(agent_id)})

            if not agent:
                error_data = {"type": "error", "data": {"error": "Agent not found"}}
                yield f"data: {json.dumps(error_data)}\n\n"
                return

            # Run streaming simulation with database integration
            streaming_generator = start_streaming_simulation_with_db(
                iterations=request.iterations,
                attack_objective=agent["objective"],
                initial_attack_prompt=request.initial_attack_prompt,
                defense_system_prompt=request.defense_system_prompt,
                agent_name=agent["name"]
            )

            # Forward all streaming data from the generator
            for stream_data in streaming_generator:
                yield f"data: {json.dumps(stream_data)}\n\n"

            # The generator should have returned the final result through StopIteration
            # But we'll add a fallback completion message
            final_completion = {"type": "complete", "data": {"message": "Simulation completed"}}
            yield f"data: {json.dumps(final_completion)}\n\n"

        except Exception as e:
            logger.error(f"Streaming simulation failed for agent {agent_id}: {e}")
            error_data = {
                "type": "error",
                "data": {
                    "error": "Streaming simulation failed. Please check your inputs and try again.",
                    "details": str(e)
                }
            }
            yield f"data: {json.dumps(error_data)}\n\n"

    return StreamingResponse(
        generate_streaming_response(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream"
        }
    )

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
        # Return mock analytics if database fails
        return {
            "total_attacks": 0,
            "successful_attacks": 0,
            "blocked_attacks": 0,
            "success_rate": 0.0,
            "avg_risk_score": 0.0
        }

@app.get("/api/analytics/{agent_id}")
async def get_agent_analytics(agent_id: str):
    """Get analytics for a specific agent"""
    try:
        analytics = db_integration.get_analytics_summary(agent_id)
        return analytics
    except Exception as e:
        # Return mock analytics if database fails
        return {
            "total_attacks": 0,
            "successful_attacks": 0,
            "blocked_attacks": 0,
            "success_rate": 0.0,
            "avg_risk_score": 0.0
        }


# Run the server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)