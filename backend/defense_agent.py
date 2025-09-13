from dataclasses import dataclass


@dataclass
class DefenseAgent:
    knowledge_base: str
    system_prompt: str
    messages: list