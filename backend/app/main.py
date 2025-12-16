from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .database import Base, engine
from .routers.conteudos import router as conteudos_router

app = FastAPI(title="Repositorio_CM API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(conteudos_router)


@app.get("/health")
def health():
    return {"status": "ok"}
