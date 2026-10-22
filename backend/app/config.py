import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True, parents=True)

EXPORTS_DIR = DATA_DIR / "exports"
EXPORTS_DIR.mkdir(exist_ok=True, parents=True)

DB_PATH = str(DATA_DIR / "revenue_intelligence.db")

# LLM Configuration (optional, falls back seamlessly to deterministic rule-based engine)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "deterministic")  # deterministic | openai | gemini
LLM_MODEL = os.getenv("LLM_MODEL", "rule-based-v1")

# App version
APP_VERSION = "1.0.0"
