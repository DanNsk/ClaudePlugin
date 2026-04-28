"""
Plan Reviewer server -- reads plan from stdin, launches browser UI,
returns approve/deny decision to Claude Code via stdout.
"""

import glob
import json
import os
import platform
import signal
import socket
import subprocess
import sys
import threading
import time
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

decisionEvent = threading.Event()
decisionResult = {}
approvedExternally = False

SCRIPT_DIR = Path(__file__).resolve().parent
RESOURCES_DIR = SCRIPT_DIR / "resources"

CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
}


def getFreePort():
    """Grab an available port from the OS."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def buildIndexHtml(planText, port):
    """Read template.html and inject plan data + port as JS globals."""
    templatePath = RESOURCES_DIR / "template.html"
    template = templatePath.read_text(encoding="utf-8")
    planJson = json.dumps(planText).replace("</", r"<\/")
    return template.replace("__PLAN_JSON__", planJson).replace("__PORT__", str(port))


def onSigterm(*_):
    """Handle SIGTERM by marking external approval."""
    global approvedExternally
    approvedExternally = True
    decisionEvent.set()


class Handler(BaseHTTPRequestHandler):
    """Handles GET / (serve UI), GET /resources/* (static), GET /status, POST /decision."""

    def log_message(self, format, *args):
        pass  # silence request logs

    def do_GET(self):
        if self.path == "/status":
            status = "approved" if approvedExternally else "waiting"
            body = json.dumps({"status": status}).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)
            return

        if self.path == "/" or self.path == "/index.html":
            html = buildIndexHtml(self.server.planText, self.server.port)
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(html.encode("utf-8"))
            return

        if self.path.startswith("/resources/"):
            filename = self.path[len("/resources/"):]
            filePath = RESOURCES_DIR / filename

            # prevent directory traversal
            try:
                filePath = filePath.resolve()
                if not str(filePath).startswith(str(RESOURCES_DIR.resolve())):
                    self.send_error(403)
                    return
            except Exception:
                self.send_error(400)
                return

            if filePath.is_file():
                ext = filePath.suffix.lower()
                contentType = CONTENT_TYPES.get(ext, "application/octet-stream")
                data = filePath.read_bytes()
                self.send_response(200)
                self.send_header("Content-Type", contentType)
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                self.wfile.write(data)
                return

        self.send_error(404)

    def do_POST(self):
        if self.path == "/decision":
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            decisionResult.update(body)
            decisionEvent.set()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"ok":true}')
        else:
            self.send_error(404)


def readPlanFromStdin():
    """Parse the hook's stdin JSON and extract the plan text.

    Tries multiple paths, then falls back to globbing the plans directory.
    """
    try:
        raw = sys.stdin.buffer.read()
        data = json.loads(raw.decode("utf-8"))
    except Exception:
        return "(Could not parse JSON from stdin)"

    # 1. tool_input.plan
    plan = None
    toolInput = data.get("tool_input", {})
    if isinstance(toolInput, dict):
        plan = toolInput.get("plan")

    # 2. data.plan
    if not plan:
        plan = data.get("plan")

    # 3. glob ~/.claude/plans/*.md -- most recently modified
    if not plan:
        plansDir = Path.home() / ".claude" / "plans"
        mdFiles = sorted(
            glob.glob(str(plansDir / "*.md")),
            key=lambda p: os.path.getmtime(p),
            reverse=True,
        )
        if mdFiles:
            try:
                plan = Path(mdFiles[0]).read_text(encoding="utf-8")
            except Exception:
                pass

    # 4. fallback: dump tool_input as JSON
    if not plan:
        if isinstance(toolInput, dict) and toolInput:
            plan = json.dumps(toolInput, indent=2)
        else:
            plan = json.dumps(data, indent=2)

    return plan.replace("\r", "") if plan else plan


def buildHookOutput():
    """Build the hookSpecificOutput JSON based on user's decision."""
    action = decisionResult.get("action", "approve")

    if action == "approve":
        return {
            "hookSpecificOutput": {
                "hookEventName": "PermissionRequest",
                "decision": {"behavior": "allow"},
            }
        }

    feedback = decisionResult.get("feedback", "User requested changes.")
    return {
        "hookSpecificOutput": {
            "hookEventName": "PermissionRequest",
            "decision": {"behavior": "deny", "message": feedback},
        }
    }


def openBrowser(url):
    """Open URL in a browser detached from the hook's process tree.

    When Claude Code approves on the console, the hook process is killed.
    Child processes that share the job/process-group get killed too, so
    the browser must be fully detached.
    """
    if os.environ.get("PLAN_REVIEWER_LEGACY_OPEN"):
        webbrowser.open(url)
        return

    system = platform.system()
    try:
        if system == "Windows":
            CREATE_BREAKAWAY_FROM_JOB = 0x01000000
            CREATE_NEW_PROCESS_GROUP = 0x00000200
            subprocess.Popen(
                ["cmd", "/c", "start", "", url],
                creationflags=CREATE_BREAKAWAY_FROM_JOB | CREATE_NEW_PROCESS_GROUP,
                close_fds=True,
            )
        elif system == "Darwin":
            subprocess.Popen(
                ["open", url],
                start_new_session=True,
                close_fds=True,
            )
        else:
            subprocess.Popen(
                ["xdg-open", url],
                start_new_session=True,
                close_fds=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
    except Exception:
        webbrowser.open(url)


def main():
    """Entry point -- read plan, start server, open browser, wait, respond."""
    planText = readPlanFromStdin()

    envPort = os.environ.get("PLAN_REVIEWER_PORT")
    port = int(envPort) if envPort else getFreePort()

    server = HTTPServer(("127.0.0.1", port), Handler)
    server.planText = planText
    server.port = port

    serverThread = threading.Thread(target=server.serve_forever, daemon=True)
    serverThread.start()

    url = f"http://127.0.0.1:{port}"

    if not os.environ.get("PLAN_REVIEWER_NO_OPEN"):
        openBrowser(url)
    else:
        print(f"Plan reviewer ready at {url}", file=sys.stderr)

    signal.signal(signal.SIGTERM, onSigterm)

    decisionEvent.wait()

    # delay shutdown so browser can detect the status change via polling
    if approvedExternally:
        time.sleep(5)

    server.shutdown()

    output = buildHookOutput()
    json.dump(output, sys.stdout)
    sys.stdout.flush()


if __name__ == "__main__":
    main()
