# simulation_wrapper.py - Wrapper for simulation.py that adds database integration
import time
from simulation import simulate_attack, seed_simulate_attack
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