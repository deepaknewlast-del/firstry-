import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from routers import bulletins, billing, generate
from middleware.security import SecurityHeadersMiddleware

app = FastAPI(
    title="ChurchPress API",
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
