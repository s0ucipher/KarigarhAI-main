import sys
import os
from pathlib import Path

# Add project root and all possible parent directories to sys.path
CURRENT_FILE = Path(__file__).resolve()
DIR = CURRENT_FILE.parent

candidates = [
    DIR.parent,         # Repo root when api/index.py is in api/
    DIR,                # When flattened in root
    Path.cwd(),         # Current working directory
    Path("/var/task"),  # Standard AWS Lambda / Vercel execution directory
]

for p in candidates:
    p_str = str(p)
    if p_str and p_str not in sys.path and p.exists():
        sys.path.insert(0, p_str)

from backend.main import app
