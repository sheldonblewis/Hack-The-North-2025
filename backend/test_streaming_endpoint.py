#!/usr/bin/env python3
"""
Quick test for the streaming endpoint
"""
import requests
import json

def test_streaming_endpoint():
    print("=== TESTING STREAMING ENDPOINT ===")

    url = "http://localhost:8000/api/agents/mock_agent_1/simulate/stream"
    headers = {
        "Content-Type": "application/json",
        "Accept": "text/event-stream"
    }
    data = {
        "iterations": 1,
        "initial_attack_prompt": "Hello test streaming",
        "defense_system_prompt": "Be helpful and safe"
    }

    print(f"POST {url}")
    print(f"Data: {json.dumps(data, indent=2)}")
    print("\n--- Streaming Response ---")

    try:
        response = requests.post(url, headers=headers, json=data, stream=True, timeout=30)

        if response.status_code != 200:
            print(f"❌ Error: {response.status_code} - {response.text}")
            return

        print("✅ Streaming started...")

        for line_num, line in enumerate(response.iter_lines(decode_unicode=True)):
            if line.strip():
                print(f"[{line_num:02d}] {line}")

            # Stop after reasonable amount of data
            if line_num > 20:
                print("... (truncated)")
                break

        print("\n✅ Streaming test completed!")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_streaming_endpoint()