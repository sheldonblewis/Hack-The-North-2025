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
    defense_system_prompt: Optional[str] = None
    iterations: Optional[int] = None
    user_id: Optional[str] = None
    created_at: Optional[datetime] = None
    _id: Optional[ObjectId] = None

    def to_dict(self):
        """Convert to dictionary for MongoDB insertion"""
        data = asdict(self)
        # Remove None values
        return {k: v for k, v in data.items() if v is not None}

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

    def to_dict(self):
        """Convert to dictionary for MongoDB insertion"""
        data = asdict(self)
        # Remove None values
        return {k: v for k, v in data.items() if v is not None}

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

    def to_dict(self):
        """Convert to dictionary for MongoDB insertion"""
        data = asdict(self)
        # Remove None values
        return {k: v for k, v in data.items() if v is not None}