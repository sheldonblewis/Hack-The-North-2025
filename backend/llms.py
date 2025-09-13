import os
import cohere

COHERE_API_KEY = os.getenv("COHERE_API_KEY")

print(COHERE_API_KEY)


# def stream_chat(prompt: str):
#     co = cohere.Client(COHERE_API_KEY)
#     response = co.chat_stream(
#         model="command-a-03-2025",
#         messages=[{"role": "user", "content": "hello world!"}],
#     )

#     for event in response:
#         if event.type == "content-delta":
#             print(event.delta.message.content.text, end="")