from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, or_
from uuid import uuid4

from .models import Conteudo, ConteudoVinculo
from .schemas import ConteudoCreate, ConteudoUpdate, ConteudoMetricasUpdate
from .services.ga4_service import get_views_by_url


def _par_vinculo(conteudo_id: str, vinculado_id: str) -> tuple[str, str]:
    return tuple(sorted([conteudo_id, vinculado_id]))


def set_conteudo_vinculos(db: Session, conteudo_id: str, vinculados_ids: list[str]) -> None:
    existentes = db.execute(
        select(ConteudoVinculo).where(
            or_(
                ConteudoVinculo.conteudo_id == conteudo_id,
                ConteudoVinculo.vinculado_id == conteudo_id,
            )
        )
    ).scalars().all()

    for vinculo in existentes:
        db.delete(vinculo)

    ids_validos: list[str] = []
    for vinculado_id in vinculados_ids:
        if vinculado_id == conteudo_id or vinculado_id in ids_validos:
            continue
        if get_conteudo(db, vinculado_id):
            ids_validos.append(vinculado_id)

    for vinculado_id in ids_validos:
        origem_id, destino_id = _par_vinculo(conteudo_id, vinculado_id)
        db.add(ConteudoVinculo(conteudo_id=origem_id, vinculado_id=destino_id))


def create_conteudo(db: Session, payload: ConteudoCreate) -> Conteudo:
    visualizacoes = payload.visualizacoes

    item = Conteudo(
        id=str(uuid4()),
        nome_projeto=payload.nome_projeto.strip(),
        canal=payload.canal.strip(),
        tipo=payload.tipo.strip(),
        visualizacoes=visualizacoes,
        segmento=payload.segmento.strip() if payload.segmento else None,
        data_publicacao=payload.data_publicacao,
        cliente=payload.cliente.strip() if payload.cliente else None,
        link=payload.link.strip(),
        descricao=payload.descricao.strip() if payload.descricao else None,
        metricas_status="manual" if visualizacoes is not None else "pendente",
        metricas_origem="manual" if visualizacoes is not None else None,
        views_atualizadas_em=datetime.now(timezone.utc) if visualizacoes is not None else None,
        metricas_erro=None,
        imagem_url=payload.imagem_url.strip() if payload.imagem_url else None,
    )
    db.add(item)
    db.flush()
    set_conteudo_vinculos(db, item.id, payload.conteudos_vinculados_ids)
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
    conteudos_vinculados_ids = data.pop("conteudos_vinculados_ids", None)
    visualizacoes_foi_atualizada = "visualizacoes" in data

    for k, v in data.items():
        if isinstance(v, str):
            v = v.strip()
        setattr(item, k, v)

    if visualizacoes_foi_atualizada:
        item.metricas_status = "manual"
        item.metricas_origem = "manual"
        item.views_atualizadas_em = datetime.now(timezone.utc)
        item.metricas_erro = None

    if conteudos_vinculados_ids is not None:
        set_conteudo_vinculos(db, item.id, conteudos_vinculados_ids)

    db.commit()
    db.refresh(item)
    return item


def preview_metricas_por_url(url: str) -> dict:
    try:
        views = get_views_by_url(url)
        return {
            "visualizacoes": views,
            "metricas_status": "sucesso",
            "metricas_origem": "ga4",
            "views_atualizadas_em": datetime.now(timezone.utc),
            "metricas_erro": None,
        }
    except Exception as e:
        return {
            "visualizacoes": 0,
            "metricas_status": "erro",
            "metricas_origem": "ga4",
            "views_atualizadas_em": datetime.now(timezone.utc),
            "metricas_erro": str(e),
        }


def update_conteudo_metricas(
    db: Session,
    conteudo_id: str,
    payload: ConteudoMetricasUpdate,
) -> Optional[Conteudo]:
    item = get_conteudo(db, conteudo_id)
    if not item:
        return None

    item.visualizacoes = payload.visualizacoes
    item.metricas_status = payload.metricas_status
    item.metricas_origem = payload.metricas_origem
    item.metricas_erro = payload.metricas_erro
    item.views_atualizadas_em = datetime.now(timezone.utc)

    db.commit()
    db.refresh(item)
    return item


def atualizar_metricas_por_ga4(db: Session, conteudo_id: str) -> Optional[Conteudo]:
    item = get_conteudo(db, conteudo_id)
    if not item:
        return None

    try:
        views = get_views_by_url(item.link)

        item.visualizacoes = views
        item.metricas_status = "sucesso"
        item.metricas_origem = "ga4"
        item.metricas_erro = None
    except Exception as e:
        item.metricas_status = "erro"
        item.metricas_origem = "ga4"
        item.metricas_erro = str(e)

    item.views_atualizadas_em = datetime.now(timezone.utc)

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
