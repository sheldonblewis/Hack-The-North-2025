from langchain_core.runnables import RunnableLambda, RunnableParallel, RunnableBranch
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from services.ext.azure_ai import get_llm
from config import AzureModels
from services.core import llm_responses as rg
from models.bot import Bot
import asyncio
from enum import Enum


class EvaluationClassification(Enum):
    CONTRADICTION = "contradiction"
    UNCERTAIN = "uncertain"
    NONE = "none"


llm = get_llm(AzureModels.gpt_4o)


initial_analysis_bot = Bot.get_bot("evaluation_analysis")
initial_analysis_prompt = initial_analysis_bot.prompt_template
initial_analysis_chain = rg.get_default_retrieval_chain(
    vector_store=initial_analysis_bot.knowledge_base,
    prompt_template=initial_analysis_prompt,
    model=AzureModels.gpt_4o,
)

classification_bot = Bot.get_bot("evaluation_classification")
classification_prompt = classification_bot.prompt_template
classification_chain = classification_prompt | llm | StrOutputParser()

summary_bot = Bot.get_bot("evaluation_summary")
summary_prompt = summary_bot.prompt_template
summary_chain = summary_prompt | llm | StrOutputParser()

situation_identifier_bot = Bot.get_bot("situation_identifier")
situation_identifier_prompt = situation_identifier_bot.prompt_template
situation_identifier_chain = situation_identifier_prompt | llm | StrOutputParser()

contradiction_amender_bot = Bot.get_bot("contradiction_amender")
contradiction_amender_prompt = contradiction_amender_bot.prompt_template
contradiction_amender_chain = contradiction_amender_prompt | llm | StrOutputParser()

suggestion_generator_bot = Bot.get_bot("suggestion_generator")
suggestion_generator_prompt = suggestion_generator_bot.prompt_template
suggestion_generator_chain = suggestion_generator_prompt | llm | StrOutputParser()


initial_analysis_stage = initial_analysis_chain | RunnableParallel(
    initial_analysis=lambda x: x["answer"],
    context=lambda x: x["context"],
    classification=lambda x: EvaluationClassification(
        rg.get_complete_response(classification_chain, x["answer"])
    ),
    simulated_user_input=lambda x: x["simulated_user_input"],
    ai_input=lambda x: x["input"],
)

summary_stage = RunnableBranch(
    (
        lambda x: x["classification"] == EvaluationClassification.CONTRADICTION
        or x["classification"] == EvaluationClassification.UNCERTAIN,
        RunnableParallel(
            summary=lambda x: rg.get_complete_response(
                summary_chain, x["initial_analysis"]
            ),
            context=lambda x: x["context"],
            initial_analysis=lambda x: x["initial_analysis"],
            classification=lambda x: x["classification"],
            simulated_user_input=lambda x: x["simulated_user_input"],
            ai_input=lambda x: x["ai_input"],
        ),
    ),
    (
        lambda x: x["classification"] == EvaluationClassification.NONE,
        RunnableParallel(
            summary=lambda x: "",
            context=lambda x: x["context"],
            initial_analysis=lambda x: x["initial_analysis"],
            classification=lambda x: x["classification"],
            simulated_user_input=lambda x: x["simulated_user_input"],
            ai_input=lambda x: x["ai_input"],
        ),
    ),
    RunnableParallel(
        summary=lambda x: "",
        context=lambda x: x["context"],
        initial_analysis=lambda x: x["initial_analysis"],
        classification=lambda x: x["classification"],
        simulated_user_input=lambda x: x["simulated_user_input"],
        ai_input=lambda x: x["ai_input"],
    ),
)

amending_stage = RunnableBranch(
    (
        lambda x: x["classification"] == EvaluationClassification.CONTRADICTION,
        RunnableParallel(
            summary=lambda x: x["summary"],
            context=lambda x: x["context"],
            initial_analysis=lambda x: x["initial_analysis"],
            classification=lambda x: x["classification"],
            situations=lambda x: [
                situation.strip()
                for situation in rg.get_complete_response(
                    situation_identifier_chain,
                    x["summary"],
                    prompt_kwargs={
                        "simulated_user_input": x["simulated_user_input"],
                        "ai_input": x["ai_input"],
                    },
                ).split("\n")
                if situation.strip() != ""
            ],
            amendment=lambda x: rg.get_complete_response(
                contradiction_amender_chain, x["summary"]
            ),
            suggestion=lambda x: None,
        ),
    ),
    (
        lambda x: x["classification"] == EvaluationClassification.UNCERTAIN,
        RunnableParallel(
            summary=lambda x: x["summary"],
            context=lambda x: x["context"],
            initial_analysis=lambda x: x["initial_analysis"],
            classification=lambda x: x["classification"],
            situations=lambda x: [
                situation.strip()
                for situation in rg.get_complete_response(
                    situation_identifier_chain,
                    x["summary"],
                    prompt_kwargs={
                        "simulated_user_input": x["simulated_user_input"],
                        "ai_input": x["ai_input"],
                    },
                ).split("\n")
                if situation.strip() != ""
            ],
            amendment=lambda x: None,
            suggestion=lambda x: rg.get_complete_response(
                suggestion_generator_chain, x["summary"], prompt_kwargs={"context" : x["context"]}
            ),
        ),
    ),
    RunnableParallel(
        summary=lambda x: x["summary"],
        context=lambda x: x["context"],
        initial_analysis=lambda x: x["initial_analysis"],
        classification=lambda x: x["classification"],
        situations=lambda x: None,
        amendment=lambda x: None,
        suggestion=lambda x: None,
    ),
)


evaluation_chain = initial_analysis_stage | summary_stage | amending_stage