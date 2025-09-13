# test_simulation_wrapper.py - Test simulation wrapper with database
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from simulation_wrapper import start_simulation_with_db

def test_simulation_wrapper():
    """Test simulation wrapper with database integration"""
    print("🧪 Testing Simulation Wrapper...")

    try:
        # Test with a safe, harmless objective
        result = start_simulation_with_db(
            iterations=1,  # Just 1 iteration for testing
            attack_objective="Generate a simple greeting message",
            initial_attack_prompt="Say hello",
            defense_system_prompt="Be helpful and respond appropriately",
            agent_name="Test Wrapper Agent"
        )

        print(f"✅ Simulation completed: {result}")
        print(f"Agent ID: {result['agent_id']}")
        print(f"Run ID: {result['run_id']}")
        print(f"Total attempts: {result['total_attempts']}")
        print(f"Successful attempts: {result['successful_attempts']}")
        print(f"Success: {result['success']}")

        print("\n🎉 Simulation wrapper test completed successfully!")
        return True

    except Exception as e:
        print(f"❌ Simulation wrapper test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_simulation_wrapper()