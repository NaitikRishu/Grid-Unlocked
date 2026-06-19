from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import routers
from ml.api.routes import events as events_router
from ml.api.routes import zones as zones_router
from ml.api.routes import simulate as simulate_router
from ml.api.routes import violations as violations_router
from ml.api.routes import routes as routes_router
from ml.api.routes import analytics as analytics_router


def create_app() -> FastAPI:
    app = FastAPI(title="Gridlock API - Phase 2 scaffold")

    origins = [
        "http://localhost:3001",
        "http://localhost:5173",
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register routers
    app.include_router(events_router.router, prefix="/events", tags=["events"])
    app.include_router(zones_router.router, prefix="/zones", tags=["zones"])
    app.include_router(simulate_router.router, prefix="/simulate", tags=["simulate"])
    app.include_router(violations_router.router, prefix="/violations", tags=["violations"])
    app.include_router(routes_router.router, prefix="/routes", tags=["routes"])
    app.include_router(analytics_router.router, prefix="/analytics", tags=["analytics"])

    @app.get("/ping")
    async def ping():
        return {"status": "ok"}

    @app.get("/api/ping")
    async def api_ping():
        return {"status": "ok"}

    return app


app = create_app()