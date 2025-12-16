from sqlalchemy import Column, String, Integer, Text, Date, DateTime
from sqlalchemy.sql import func
from .database import Base


class Conteudo(Base):
    __tablename__ = "conteudos"

    id = Column(String, primary_key=True, index=True)  # UUID string

    nome_projeto = Column(String, nullable=False, index=True)

    canal = Column(String, nullable=False, index=True)  # site/youtube/instagram/tiktok/kwai/facebook
    tipo = Column(String, nullable=False, index=True)   # publieditorial/manchete/...

    visualizacoes = Column(Integer, nullable=True)
    segmento = Column(String, nullable=True, index=True)
    data_publicacao = Column(Date, nullable=True)
    cliente = Column(String, nullable=True, index=True)

    link = Column(String, nullable=False)
    descricao = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
