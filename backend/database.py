import os
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Database:
    def __init__(self):
        self.connection_uri = os.getenv("MONGODB_URI")
        self.db_name = os.getenv("MONGODB_DB_NAME", "ai-redteam")
        self.client = None
        self.db = None

        if not self.connection_uri:
            raise ValueError("MONGODB_URI environment variable is required")

    def connect(self):
        """Connect to MongoDB Atlas"""
        try:
            self.client = MongoClient(self.connection_uri)
            self.db = self.client[self.db_name]

            # Test the connection using the official method
            self.client.admin.command('ping')
            logger.info(f"Successfully connected to MongoDB: {self.db_name}")

            return True
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            return False

    def disconnect(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")

    def get_collection(self, collection_name):
        """Get a specific collection"""
        if self.db is None:
            raise Exception("Database not connected")
        return self.db[collection_name]

# Collection names (for consistency)
COLLECTIONS = {
    "USERS": "users",
    "AGENTS": "agents",
    "ATTACK_SCENARIOS": "attack_scenarios",
    "TEST_RUNS": "test_runs",
    "ATTACK_RESULTS": "attack_results",
    "ANALYTICS": "analytics"
}

# Global database instance
db_instance = Database()

def get_db():
    """Get database instance"""
    if db_instance.db is None:
        db_instance.connect()
    return db_instance

def close_db():
    """Close database connection"""
    db_instance.disconnect()

# Helper functions for common operations
def insert_agent(agent_data):
    """Insert a new agent"""
    db = get_db()
    agents_collection = db.get_collection(COLLECTIONS["AGENTS"])

    # Add timestamps
    agent_data["created_at"] = datetime.utcnow()
    agent_data["updated_at"] = datetime.utcnow()

    result = agents_collection.insert_one(agent_data)
    return result.inserted_id

def get_agents(user_id=None):
    """Get all agents, optionally filtered by user"""
    db = get_db()
    agents_collection = db.get_collection(COLLECTIONS["AGENTS"])

    query = {} if not user_id else {"user_id": user_id}
    agents = list(agents_collection.find(query).sort("created_at", -1))

    # Convert ObjectId to string for JSON serialization
    for agent in agents:
        agent["_id"] = str(agent["_id"])

    return agents

def insert_attack_result(result_data):
    """Insert attack result"""
    db = get_db()
    results_collection = db.get_collection(COLLECTIONS["ATTACK_RESULTS"])

    # Add timestamp
    result_data["timestamp"] = datetime.utcnow()

    result = results_collection.insert_one(result_data)
    return result.inserted_id

def get_attack_results(agent_id=None, limit=100):
    """Get attack results, optionally filtered by agent"""
    db = get_db()
    results_collection = db.get_collection(COLLECTIONS["ATTACK_RESULTS"])

    query = {} if not agent_id else {"agent_id": agent_id}
    results = list(results_collection.find(query).sort("timestamp", -1).limit(limit))

    # Convert ObjectId to string
    for result in results:
        result["_id"] = str(result["_id"])

    return results

def get_analytics_summary(agent_id=None):
    """Get analytics summary"""
    db = get_db()
    results_collection = db.get_collection(COLLECTIONS["ATTACK_RESULTS"])

    # Build aggregation pipeline
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
                "avg_risk_score": {"$avg": "$risk_score"},
                "attack_types": {"$push": "$attack_type"}
            }
        }
    ]

    result = list(results_collection.aggregate(pipeline))
    return result[0] if result else None

# Test function
def test_connection():
    """Test MongoDB connection"""
    try:
        # Get database instance
        db_instance = get_db()

        # Test inserting a sample document
        test_collection = db_instance.get_collection("test")
        test_doc = {"test": True, "timestamp": datetime.utcnow()}

        # Insert document
        result = test_collection.insert_one(test_doc)
        logger.info(f"Test document inserted with ID: {result.inserted_id}")

        # Verify document exists
        found_doc = test_collection.find_one({"_id": result.inserted_id})
        if found_doc:
            logger.info("Test document successfully retrieved")

        # Clean up test document
        delete_result = test_collection.delete_one({"_id": result.inserted_id})
        logger.info(f"Test document cleaned up: {delete_result.deleted_count} document(s) deleted")

        logger.info("Database connection test completed successfully!")
        return True
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        return False

if __name__ == "__main__":
    # Run connection test
    test_connection()
    close_db()