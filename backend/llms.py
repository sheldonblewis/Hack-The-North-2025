import os
from dotenv import load_dotenv
from dataclasses import dataclass
from cerebras.cloud.sdk import Cerebras
import cohere

load_dotenv()

COHERE_API_KEY = os.getenv("COHERE_API_KEY")
CEREBRAS_API_KEY = os.getenv("CEREBRAS_API_KEY")

co = cohere.ClientV2(COHERE_API_KEY)
cereb = Cerebras(api_key=CEREBRAS_API_KEY)


def cohere_stream_chat(prompt: str):
    response = co.chat_stream(
        model="command-a-03-2025",
            messages=[{"role": "user", "content": prompt}],
    )

    for event in response:
        if event.type == "content-delta":
            print(event.delta.message.content.text, end="", flush=True)
        elif event.type == "message-start":
            pass
        elif event.type == "message-end":
            print("", flush=True)
        elif event.type == "error":
            print(f"\n[stream error] {event.error.message}\n", flush=True)
            return 400


def cohere_embeddings():
    return


def cerebras_stream_chat(prompt: str):
    stream = cereb.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        model="llama-4-scout-17b-16e-instruct",
        stream=True,
        max_completion_tokens=20000,
        temperature=1,
        top_p=0.8
    )

    for chunk in stream:
        print(chunk.choices[0].delta.content or "", end="", flush=True)


if __name__ == "__main__":
    cerebras_stream_chat("Hey how are you doing?")