from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class ConteudoBase(BaseModel):
    nome_projeto: str = Field(min_length=1)

    canal: str = Field(min_length=1)
    tipo: str = Field(min_length=1)

    visualizacoes: Optional[int] = None
    segmento: Optional[str] = None
    data_publicacao: Optional[date] = None
    cliente: Optional[str] = None

    link: str = Field(min_length=1)
    descricao: Optional[str] = None


class ConteudoCreate(ConteudoBase):
    pass


class ConteudoUpdate(BaseModel):
    nome_projeto: Optional[str] = None
    canal: Optional[str] = None
    tipo: Optional[str] = None
    visualizacoes: Optional[int] = None
    segmento: Optional[str] = None
    data_publicacao: Optional[date] = None
    cliente: Optional[str] = None
    link: Optional[str] = None
    descricao: Optional[str] = None


class ConteudoOut(ConteudoBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
