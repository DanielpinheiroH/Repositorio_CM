from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import ConteudoCreate, ConteudoOut, ConteudoUpdate
from .. import crud

router = APIRouter(prefix="/conteudos", tags=["Conteúdos"])


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


@router.delete("/{conteudo_id}", status_code=204)
def deletar(conteudo_id: str, db: Session = Depends(get_db)):
    ok = crud.delete_conteudo(db, conteudo_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Conteúdo não encontrado")
    return None
