"""
Convenience entry-point for running the Flask development server.

Usage:
    python run.py

Or directly with the venv:
    venv\\Scripts\\python.exe run.py
"""

import os
from app import app

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("DEBUG", "False") == "True"

    print("\n" + "=" * 50)
    print("  TomatoAI Backend")
    print("=" * 50)
    print(f"  URL:   http://localhost:{port}")
    print(f"  Debug: {debug}")
    print(f"  Docs:  http://localhost:{port}/api/health")
    print("=" * 50 + "\n")

    app.run(host="0.0.0.0", port=port, debug=debug, use_reloader=False)
