from pathlib import Path
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import (
    ConteudoCreate,
    ConteudoOut,
    ConteudoUpdate,
    ConteudoMetricasUpdate,
    ConteudoMetricasPreviewIn,
    ConteudoMetricasPreviewOut,
)
from .. import crud

router = APIRouter(prefix="/conteudos", tags=["Conteúdos"])

ALLOWED_IMAGE_TYPES = {
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
}

ALLOWED_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
}

BASE_DIR = Path(__file__).resolve().parent.parent.parent
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


@router.get("", response_model=list[ConteudoOut])
def listar(
    canal: Optional[str] = None,
    tipo: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    return crud.list_conteudos(db, canal=canal, tipo=tipo, q=q, limit=limit, offset=offset)


@router.post("", response_model=ConteudoOut, status_code=201)
def criar(payload: ConteudoCreate, db: Session = Depends(get_db)):
    return crud.create_conteudo(db, payload)


@router.post("/upload-imagem")
async def upload_imagem(request: Request, file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Arquivo inválido")

    ext = Path(file.filename).suffix.lower()
    content_type = (file.content_type or "").lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Formato inválido. Envie PNG, JPG, JPEG ou WEBP.",
        )

    if content_type and content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Tipo de arquivo inválido. Envie PNG, JPG, JPEG ou WEBP.",
        )

    filename = f"{uuid4().hex}{ext}"
    file_path = UPLOADS_DIR / filename

    content = await file.read()
    file_path.write_bytes(content)

    file_url = str(request.base_url).rstrip("/") + f"/uploads/{filename}"

    return {
        "filename": filename,
        "url": file_url,
    }


@router.post("/metricas-preview", response_model=ConteudoMetricasPreviewOut)
def metricas_preview(payload: ConteudoMetricasPreviewIn):
    return crud.preview_metricas_por_url(payload.url)


@router.get("/{conteudo_id}", response_model=ConteudoOut)
def obter(conteudo_id: str, db: Session = Depends(get_db)):
    item = crud.get_conteudo(db, conteudo_id)
    if not item:
        raise HTTPException(status_code=404, detail="Conteúdo não encontrado")
    return item


@router.put("/{conteudo_id}", response_model=ConteudoOut)
def atualizar(conteudo_id: str, payload: ConteudoUpdate, db: Session = Depends(get_db)):
    item = crud.update_conteudo(db, conteudo_id, payload)
    if not item:
        raise HTTPException(status_code=404, detail="Conteúdo não encontrado")
    return item


@router.post("/{conteudo_id}/metricas", response_model=ConteudoOut)
def atualizar_metricas(
    conteudo_id: str,
    db: Session = Depends(get_db),
):
    item = crud.atualizar_metricas_por_ga4(db, conteudo_id)
    if not item:
        raise HTTPException(status_code=404, detail="Conteúdo não encontrado")
    return item


@router.delete("/{conteudo_id}", status_code=204)
def deletar(conteudo_id: str, db: Session = Depends(get_db)):
    ok = crud.delete_conteudo(db, conteudo_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Conteúdo não encontrado")
    return None