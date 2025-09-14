# simulation_wrapper.py - Wrapper for simulation.py that adds database integration
import time
from simulation import simulate_attack, seed_simulate_attack, start_simulation
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
        # Start with user's custom prompt directly (skip seed prompts)
        defense_message = defense_agent.ask(initial_attack_prompt)
        state = attack_agent.evaluate_broken(defense_message)

        total_attempts += 1

        # Save initial attempt with user's custom prompt
        db_integration.save_attack_attempt(
            agent_id=agent_id,
            attack_strategy="custom_prompt",
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
        error_message = str(e)
        logger.error(f"Simulation failed: {e}")

        # Handle specific API errors more gracefully
        if ("context_length_exceeded" in error_message.lower() or
            "length is" in error_message.lower() or
            "current length is" in error_message.lower() or
            "while limit is" in error_message.lower()):
            logger.error(f"Context length exceeded - response too long: {error_message}")
            db_integration.update_simulation_run(run_id, total_attempts, successful_attempts, "failed")
            # Return a more user-friendly error instead of raising
            return {
                "success": False,
                "agent_id": agent_id,
                "run_id": run_id,
                "total_attempts": total_attempts,
                "successful_attempts": successful_attempts,
                "error": "AI response exceeded length limit. Try a more specific or shorter prompt to get a focused response."
            }
        else:
            db_integration.update_simulation_run(run_id, total_attempts, successful_attempts, "failed")
            raise

def seed_simulate_attack_with_db(defense: DefenseAgent, attack: JailBreakAgent,
                                attack_prompt: str, agent_id: str, strategy: str):
    """Wrapper for seed_simulate_attack with database integration"""

    try:
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
    except Exception as e:
        error_message = str(e)
        if ("context_length_exceeded" in error_message.lower() or
            "length is" in error_message.lower() or
            "current length is" in error_message.lower()):
            logger.error(f"Context length exceeded in seed attack: {error_message}")
            # Save failed attempt to database
            db_integration.save_attack_attempt(
                agent_id=agent_id,
                attack_strategy=strategy,
                prompt=attack_prompt,
                response="Error: Response too long for API limit",
                evaluation_result=False
            )
            return False
        else:
            raise

def simulate_attack_with_db(defense: DefenseAgent, attack: JailBreakAgent,
                          previous_prompt: str, defense_message: str,
                          agent_id: str, strategy: str):
    """Wrapper for simulate_attack with database integration"""

    try:
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
    except Exception as e:
        error_message = str(e)
        if ("context_length_exceeded" in error_message.lower() or
            "length is" in error_message.lower() or
            "current length is" in error_message.lower()):
            logger.error(f"Context length exceeded in attack simulation: {error_message}")
            # Save failed attempt to database
            db_integration.save_attack_attempt(
                agent_id=agent_id,
                attack_strategy=strategy,
                prompt=previous_prompt,
                response="Error: Response too long for API limit",
                evaluation_result=False
            )
            return False
        else:
            raise
def start_streaming_simulation_with_db(iterations: int, attack_objective: str,
                                     initial_attack_prompt: str, defense_system_prompt: str,
                                     agent_name: str = None):
    """
    Streaming version that bridges the new generator-based simulation with database integration

    Yields streaming metadata and saves results to database

    Yields:
        dict: Streaming metadata with conversation_history and state updates

    Returns (via StopIteration):
        dict: Final results with success status and statistics
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

    logger.info(f"Starting streaming simulation - Agent ID: {agent_id}, Run ID: {run_id}")
    
    total_attempts = 0
    successful_attempts = 0

    try:
        # Use the streaming start_simulation but intercept and save results
        conversation_history = []

        # Create the generator from the new streaming simulation
        simulation_generator = start_simulation(iterations, attack_objective, defense_system_prompt, initial_attack_prompt)

        # Process each yielded metadata and forward it
        for metadata in simulation_generator:
            # Forward the streaming metadata to the client
            yield {
                "type": "progress",
                "data": metadata,
                "agent_id": agent_id,
                "run_id": run_id
            }

            # Extract conversation history to save to database
            if "conversation_history" in metadata:
                conversation_history = metadata["conversation_history"]

                # Save each new conversation item to database
                for item in conversation_history:
                    if "attack_prompt" in item and "defense_message" in item:
                        # This is a complete attack/defense exchange
                        total_attempts += 1

                        # We need to evaluate if this was successful
                        # Create temporary agents to evaluate
                        temp_attack_agent = JailBreakAgent(objective=attack_objective)
                        evaluation_result = temp_attack_agent.evaluate_broken(item["defense_message"])

                        if evaluation_result:
                            successful_attempts += 1

                        # Save to database
                        db_integration.save_attack_attempt(
                            agent_id=agent_id,
                            attack_strategy="streaming_simulation",
                            prompt=item["attack_prompt"],
                            response=item["defense_message"],
                            evaluation_result=evaluation_result
                        )

    except StopIteration as e:
        # The generator returned a final result
        final_result = e.value if hasattr(e, 'value') else (successful_attempts > 0)

        # Update final statistics
        db_integration.update_simulation_run(run_id, total_attempts, successful_attempts)

        # Return final result
        return {
            "success": bool(final_result),
            "agent_id": agent_id,
            "run_id": run_id,
            "total_attempts": total_attempts,
            "successful_attempts": successful_attempts
        }

    except Exception as e:
        error_message = str(e)
        logger.error(f"Streaming simulation failed: {e}")

        # Handle context length errors gracefully
        if (("context_length_exceeded" in error_message.lower() or
            "length is" in error_message.lower() or
            "current length is" in error_message.lower() or
            "while limit is" in error_message.lower())):
            logger.error(f"Context length exceeded in streaming simulation: {error_message}")
            db_integration.update_simulation_run(run_id, total_attempts, successful_attempts, "failed")

            # Yield error state and return graceful failure
            yield {
                "type": "error",
                "data": {
                    "error": "AI response exceeded length limit. Try a more specific or shorter prompt.",
                    "agent_id": agent_id,
                    "run_id": run_id
                }
            }

            return {
                "success": False,
                "agent_id": agent_id,
                "run_id": run_id,
                "total_attempts": total_attempts,
                "successful_attempts": successful_attempts,
                "error": "Context length exceeded"
            }
        else:
            db_integration.update_simulation_run(run_id, total_attempts, successful_attempts, "failed")
            raise
