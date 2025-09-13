from dataclasses import dataclass
from langchain.vectorstores import VectorStore
from typing import Optional, ClassVar, Self
from services.core.llm_responses import vector_store_from_gsheet, get_prompt_template, get_default_retrieval_chain
from services.core.llm_responses import AzureModels
from langchain_core.runnables import RunnableSerializable
from langchain_core.prompts import ChatPromptTemplate
from abc import ABC, abstractmethod

@dataclass
class Bot:
    id : str

    system_prompt : str
    leading_prompt : str
    input_template : str
    knowledge_base : Optional[VectorStore] = None
    prompt_template : ChatPromptTemplate = None



    _bots : ClassVar[dict[str, Self]] = {}

    def __post_init__(self):
        if self.id in self._bots:
            return
        
        self.prompt_template = get_prompt_template(
            sys_prompt=self.system_prompt, leading_prompt=self.leading_prompt, input_template=self.input_template
        )
        
        self._bots[self.id] = self

    @classmethod
    def get_bot(cls, id : str) -> Self:
        return cls._bots[id]
    
    

@dataclass
class BotBuilder(ABC):
    id : str
    knowledge_base : Optional[VectorStore] = None
    system_prompt : Optional[str] = ""
    leading_prompt : Optional[str] = ""
    input_template : Optional[str] = "{input}"

    def with_input_template(self, input_template : str):
        self.input_template = input_template
        return self

    def with_gsheet(self, gsheet_url : str):
        self.knowledge_base = vector_store_from_gsheet(gsheet_url)
        return self
    
    def build(self):
        return Bot(id=self.id, knowledge_base=self.knowledge_base, system_prompt=self.system_prompt, leading_prompt=self.leading_prompt, input_template=self.input_template)

    @abstractmethod
    def load_prompts(self):
        pass

@dataclass
class ConstBotBuilder(BotBuilder):
    def load_prompts(self):
        try:
            with open(f"resources/prompts/{self.id}/main.txt", "r") as f:
                self.system_prompt = f.read()
        except FileNotFoundError:
            self.system_prompt = ""

        try:
            with open(f"resources/prompts/{self.id}/leading.txt", "r") as f:
                self.leading_prompt = f.read()
        except FileNotFoundError:
            self.leading_prompt = ""
        
        return self

@dataclass
class CustomBotBuilder(BotBuilder):
    def load_prompts(self):
        pass

ConstBotBuilder("test_sim").with_gsheet("https://docs.google.com/spreadsheets/d/1o8Uqslo6y5V4WY53_AWgrlGdy1MnvYanDtwZPWA95ak/edit?usp=sharing") \
    .load_prompts() \
    .build()

ConstBotBuilder("test_user").with_gsheet("https://docs.google.com/spreadsheets/d/1yYjDv9xcEQ9mzU2cZ2FmxxpdZSBwZoP6stJmAn5Mqy4/edit?usp=sharing") \
    .load_prompts() \
    .build()

ConstBotBuilder("evaluation_analysis").with_gsheet("https://docs.google.com/spreadsheets/d/1yYjDv9xcEQ9mzU2cZ2FmxxpdZSBwZoP6stJmAn5Mqy4/edit?usp=sharing") \
    .with_input_template("User Input: {simulated_user_input}\nAI Response: {input}\n\nOutput: ") \
    .load_prompts() \
    .build()

ConstBotBuilder("evaluation_classification").with_input_template("Analysis: {input}\n\nOutput: ") \
    .load_prompts() \
    .build()

ConstBotBuilder("evaluation_summary").with_input_template("User Analysis: {input}\n\nOutput: ") \
    .load_prompts() \
    .build()

ConstBotBuilder("situation_identifier").with_input_template("Hallucination Summary:{input}\n\nRaw Conversation:\nUser Input:{simulated_user_input}\nAI Response:{ai_input}\n\nOutput: ") \
    .load_prompts() \
    .build()

ConstBotBuilder("contradiction_amender").with_input_template("Hallucination Summary: {input}\n\nOutput: ") \
    .load_prompts() \
    .build()

ConstBotBuilder("suggestion_generator").with_input_template("Hallucination Summary: {input}\n\nOutput: ") \
    .load_prompts() \
    .build()

