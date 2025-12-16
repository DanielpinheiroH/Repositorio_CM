from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, or_
from uuid import uuid4
from .models import Conteudo
from .schemas import ConteudoCreate, ConteudoUpdate


def create_conteudo(db: Session, payload: ConteudoCreate) -> Conteudo:
    item = Conteudo(
        id=str(uuid4()),
        nome_projeto=payload.nome_projeto.strip(),
        canal=payload.canal.strip(),
        tipo=payload.tipo.strip(),
        visualizacoes=payload.visualizacoes,
        segmento=payload.segmento.strip() if payload.segmento else None,
        data_publicacao=payload.data_publicacao,
        cliente=payload.cliente.strip() if payload.cliente else None,
        link=payload.link.strip(),
        descricao=payload.descricao.strip() if payload.descricao else None,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def list_conteudos(
    db: Session,
    canal: Optional[str] = None,
    tipo: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> list[Conteudo]:
    stmt = select(Conteudo)

    if canal:
        stmt = stmt.where(Conteudo.canal == canal)
    if tipo:
        stmt = stmt.where(Conteudo.tipo == tipo)

    if q:
        term = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                Conteudo.nome_projeto.ilike(term),
                Conteudo.cliente.ilike(term),
                Conteudo.segmento.ilike(term),
                Conteudo.descricao.ilike(term),
                Conteudo.link.ilike(term),
            )
        )

    stmt = stmt.order_by(Conteudo.created_at.desc()).limit(limit).offset(offset)
    return list(db.execute(stmt).scalars().all())


def get_conteudo(db: Session, conteudo_id: str) -> Optional[Conteudo]:
    stmt = select(Conteudo).where(Conteudo.id == conteudo_id)
    return db.execute(stmt).scalars().first()


def update_conteudo(db: Session, conteudo_id: str, payload: ConteudoUpdate) -> Optional[Conteudo]:
    item = get_conteudo(db, conteudo_id)
    if not item:
        return None

    data = payload.model_dump(exclude_unset=True)

    for k, v in data.items():
        if isinstance(v, str):
            v = v.strip()
        setattr(item, k, v)

    db.commit()
    db.refresh(item)
    return item


def delete_conteudo(db: Session, conteudo_id: str) -> bool:
    item = get_conteudo(db, conteudo_id)
    if not item:
        return False
    db.delete(item)
    db.commit()
    return True
