from agents import DefenseAgent, JailBreakAgent



def simulate_attack(defense: DefenseAgent, attack: JailBreakAgent):

    attack.attack_prompts_list.append()

    return





def start_simulation(iterations, attack_objective, initial_attack_prompt, 
                        defense_system_prompt):
    
    defense = DefenseAgent(system_prompt=defense_system_prompt)
    attack = JailBreakAgent(objective=attack_objective)


    # Test out initial attack prompt
    attack.attack_prompts_list.appned(initial_attack_prompt)

    return_message = defense.ask(attack.attack_prompts_list[-1])

    status = attack.evaluate_broken(return_message)

    # Iterate
    for i in range(iterations):
        pass
    
    return







if __name__ == "__main__":
    pass