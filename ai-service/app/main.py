import logging
from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.market import router as market_router
from app.api.news import router as news_router
from app.nlp.sentiment_analyzer import sentiment_analyzer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("insighter-ai")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Load FinBERT before accepting requests; initialization failures use the lexicon fallback."""
    if sentiment_analyzer.enable_finbert:
        logger.info("Warming up sentiment model before serving requests.")
        logger.info("Sentiment model ready: %s", sentiment_analyzer.warm_up())
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="InsighterTrading Financial Market Intelligence & Analytics Engine",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits backend & frontend access in dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(market_router)
app.include_router(news_router)


@app.get("/health", tags=["Health"])
@app.get("/api/v1/health", tags=["Health"])
def health_check():
    return {
        "status": "UP",
        "service": "insighter-ai-service",
        "version": settings.app_version,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=settings.debug)
