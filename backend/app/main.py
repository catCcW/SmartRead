from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from .api import books, reader, ai, config, notes

app = FastAPI(title="SmartRead API")

# 允许跨域请求 (前端 React 默认在 1420 端口)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 开发环境允许所有
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 注册路由
app.include_router(books.router, prefix="/api", tags=["books"])
app.include_router(reader.router, prefix="/api", tags=["reader"])
app.include_router(ai.router, prefix="/api", tags=["ai"])
app.include_router(config.router, prefix="/api", tags=["config"])
app.include_router(notes.router, prefix="/api", tags=["notes"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
