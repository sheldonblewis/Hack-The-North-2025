from flask import Flask, Response, render_template_string
import time

app = Flask(__name__)

# Simple HTML template with a stream area
HTML = """
<!doctype html>
<html>
  <head>
    <title>Live Stream</title>
  </head>
  <body>
    <h1>Python Stream</h1>
    <div id="stream"></div>
    <script>
      const eventSource = new EventSource("/stream");
      eventSource.onmessage = function(e) {
        const div = document.getElementById("stream");
        div.innerHTML += e.data + "<br>";
      };
    </script>
  </body>
</html>
"""

@app.route("/")
def index():
    return render_template_string(HTML)

@app.route("/stream")
def stream():
    def generate():
        for i in range(10):  # Replace this with your function’s output
            yield f"data: Message {i}\\n\\n"
            time.sleep(1)
    return Response(generate(), mimetype="text/event-stream")

if __name__ == "__main__":
    app.run(debug=True, threaded=True)
