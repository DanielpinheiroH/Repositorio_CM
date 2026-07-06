from sqlalchemy import CheckConstraint, Column, ForeignKey, String, Integer, Text, Date, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class ConteudoVinculo(Base):
    __tablename__ = "conteudo_vinculos"

    conteudo_id = Column(String, ForeignKey("conteudos.id", ondelete="CASCADE"), primary_key=True)
    vinculado_id = Column(String, ForeignKey("conteudos.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("conteudo_id != vinculado_id", name="ck_conteudo_vinculo_distinto"),
    )

    conteudo = relationship(
        "Conteudo",
        foreign_keys=[conteudo_id],
        back_populates="vinculos_origem",
    )
    vinculado = relationship(
        "Conteudo",
        foreign_keys=[vinculado_id],
        back_populates="vinculos_destino",
    )


class Conteudo(Base):
    __tablename__ = "conteudos"

    id = Column(String, primary_key=True, index=True)

    nome_projeto = Column(String, nullable=False, index=True)

    canal = Column(String, nullable=False, index=True)
    tipo = Column(String, nullable=False, index=True)

    visualizacoes = Column(Integer, nullable=True)
    segmento = Column(String, nullable=True, index=True)
    data_publicacao = Column(Date, nullable=True)
    cliente = Column(String, nullable=True, index=True)

    link = Column(String, nullable=False)
    descricao = Column(Text, nullable=True)
    imagem_url = Column(String, nullable=True)

    metricas_status = Column(String, nullable=False, default="pendente", index=True)
    metricas_origem = Column(String, nullable=True)
    views_atualizadas_em = Column(DateTime(timezone=True), nullable=True)
    metricas_erro = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    vinculos_origem = relationship(
        "ConteudoVinculo",
        foreign_keys=[ConteudoVinculo.conteudo_id],
        back_populates="conteudo",
        cascade="all, delete-orphan",
    )
    vinculos_destino = relationship(
        "ConteudoVinculo",
        foreign_keys=[ConteudoVinculo.vinculado_id],
        back_populates="vinculado",
        cascade="all, delete-orphan",
    )

    @property
    def conteudos_vinculados(self):
        vinculados = [v.vinculado for v in self.vinculos_origem]
        vinculados.extend(v.conteudo for v in self.vinculos_destino)
        return vinculados
