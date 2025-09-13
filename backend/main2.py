from flask import Flask, Response
import asyncio
import simulation

app = Flask(__name__)

@app.route("/v1/stream_simulation")
def stream_simulation(iterations, objective, defense_system_prompt):
    return Response(simulation.start_simulation(iterations, objective, defense_system_prompt) ,mimetype="text/event-stream")