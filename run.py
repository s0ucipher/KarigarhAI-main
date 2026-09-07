import uvicorn
import os
import sys

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"============================================================")
    print(f"   KalaSetu AI - Artisan Marketplace Server Starting")
    print(f"   Listening on: http://127.0.0.1:{port}")
    print(f"============================================================")
    uvicorn.run("backend.main:app", host=host, port=port, reload=True)
