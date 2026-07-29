from __future__ import annotations

import os
import sys


if __package__ is None or __package__ == "":
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
    from backend.app import create_app
else:
    from .app import create_app


app = create_app()


def main() -> None:
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "5000"))
    debug = app.config.get("DEBUG", False)
    app.run(host=host, port=port, debug=debug)


if __name__ == "__main__":
    main()

