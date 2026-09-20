import asyncio
import logging
import os
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from routers import bulletins, billing, generate
from middleware.security import SecurityHeadersMiddleware

logger = logging.getLogger(__name__)

# Render's free tier sleeps an instance after ~15 min without web traffic.
# A keep-alive ping every 10 min keeps it warm. Only runs when Render sets
# RENDER_EXTERNAL_URL — local dev, where it is unset, is unaffected.
KEEPALIVE_INTERVAL_SECONDS = 600


async def _keepalive_loop() -> None:
    base_url = os.getenv("RENDER_EXTERNAL_URL", "").rstrip("/")
    if not base_url:
        return
    logger.info("Keep-alive pinging %s/health every %ds", base_url, KEEPALIVE_INTERVAL_SECONDS)
    async with httpx.AsyncClient() as client:
        while True:
            await asyncio.sleep(KEEPALIVE_INTERVAL_SECONDS)
            try:
                resp = await client.get(f"{base_url}/health", timeout=10.0)
                logger.debug("Keep-alive ping: %s", resp.status_code)
            except Exception as e:  # never let the loop die
                logger.warning("Keep-alive ping failed: %s", e)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(_keepalive_loop())
    yield
    task.cancel()


app = FastAPI(
    title="ChurchPress API",
    lifespan=lifespan,
    # Disable interactive docs in production; available at /docs in dev.
    docs_url=None if os.getenv("ENVIRONMENT") == "production" else "/docs",
    redoc_url=None,
    openapi_url=None if os.getenv("ENVIRONMENT") == "production" else "/openapi.json",
)

# CORS — only allow the configured frontend origins.
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
app.add_middleware(GZipMiddleware, minimum_size=1024)
app.add_middleware(SecurityHeadersMiddleware)

app.include_router(generate.router, prefix="/api/generate", tags=["generate"])
app.include_router(billing.router, prefix="/api/billing", tags=["billing"])
app.include_router(bulletins.router, prefix="/api/bulletins", tags=["bulletins"])


@app.get("/health")
async def health():
    return {"status": "ok"}
