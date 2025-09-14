# database_integration.py - Wrapper functions for database integration
from database import get_db, COLLECTIONS
from models import AgentModel, AttackAttemptModel, SimulationRunModel
from datetime import datetime
from bson import ObjectId
import logging
import time

logger = logging.getLogger(__name__)

class DatabaseIntegration:
    def __init__(self):
        self._db = None

    def get_db(self):
        """Thread-safe database getter"""
        if self._db is None:
            self._db = get_db()
        return self._db

    def save_agent(self, name: str, objective: str, model_provider: str = "cerebras",
                   model_name: str = "llama-4-scout-17b-16e-instruct",
                   defense_system_prompt: str = None, iterations: int = None) -> str:
        """Save agent configuration to database"""
        agent_data = AgentModel(
            name=name,
            objective=objective,
            model_provider=model_provider,
            model_name=model_name,
            defense_system_prompt=defense_system_prompt,
            iterations=iterations,
            created_at=datetime.utcnow()
        )

        collection = self.get_db().get_collection(COLLECTIONS["AGENTS"])
        result = collection.insert_one(agent_data.to_dict())

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

        collection = self.get_db().get_collection(COLLECTIONS["ATTACK_RESULTS"])
        result = collection.insert_one(attempt_data.to_dict())

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

        collection = self.get_db().get_collection(COLLECTIONS["TEST_RUNS"])
        result = collection.insert_one(run_data.to_dict())

        logger.info(f"Simulation run started with ID: {result.inserted_id}")
        return str(result.inserted_id)

    def update_simulation_run(self, run_id: str, total_attempts: int,
                            successful_attempts: int, status: str = "completed"):
        """Update simulation run statistics"""
        collection = self.get_db().get_collection(COLLECTIONS["TEST_RUNS"])

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

    def get_agent_results(self, agent_id: str, limit: int = 50):
        """Get attack results for a specific agent"""
        collection = self.get_db().get_collection(COLLECTIONS["ATTACK_RESULTS"])

        results = list(collection.find({"agent_id": agent_id})
                      .sort("timestamp", -1)
                      .limit(limit))

        # Convert ObjectId to string for JSON serialization
        for result in results:
            result["_id"] = str(result["_id"])

        return results

    def get_analytics_summary(self, agent_id: str = None):
        """Get analytics summary for dashboard"""
        collection = self.get_db().get_collection(COLLECTIONS["ATTACK_RESULTS"])

        # Build match stage
        match_stage = {} if not agent_id else {"agent_id": agent_id}

        pipeline = [
            {"$match": match_stage},
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

        result = list(collection.aggregate(pipeline))

        if result:
            analytics = result[0]
            # Calculate success rate
            total = analytics["total_attacks"]
            analytics["success_rate"] = (analytics["successful_attacks"] / total * 100) if total > 0 else 0
            return analytics

        # Return default values if no data
        return {
            "total_attacks": 0,
            "successful_attacks": 0,
            "blocked_attacks": 0,
            "avg_risk_score": 0,
            "success_rate": 0
        }

# Global instance
db_integration = DatabaseIntegration()