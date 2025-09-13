# test_integration.py - Test database integration
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database_integration import db_integration
from database import get_db, COLLECTIONS

def test_database_integration():
    """Test database integration"""
    print("🧪 Testing Database Integration...")

    try:
        # Test database connection
        db = get_db()
        print("✅ Database connected successfully")

        # Test saving an agent
        agent_id = db_integration.save_agent(
            name="Test Agent",
            objective="Test objective for integration",
            model_provider="cerebras",
            model_name="llama-4-scout-17b-16e-instruct"
        )
        print(f"✅ Agent created with ID: {agent_id}")

        # Test saving an attack attempt
        attempt_id = db_integration.save_attack_attempt(
            agent_id=agent_id,
            attack_strategy="test_strategy",
            prompt="Test prompt",
            response="Test response",
            evaluation_result=False
        )
        print(f"✅ Attack attempt saved with ID: {attempt_id}")

        # Test analytics
        analytics = db_integration.get_analytics_summary()
        print(f"✅ Analytics retrieved: {analytics}")

        # Test getting agent results
        results = db_integration.get_agent_results(agent_id)
        print(f"✅ Found {len(results)} results for agent {agent_id}")

        print("\n🎉 Database integration test completed successfully!")
        return True

    except Exception as e:
        print(f"❌ Database integration test failed: {e}")
        return False

if __name__ == "__main__":
    test_database_integration()