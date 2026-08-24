from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


CANAIS_VALIDOS = {
    "site",
    "youtube",
    "instagram",
    "tiktok",
    "kwai",
    "facebook",
}

TIPOS_VALIDOS = {
    "conteudo-de-marca",
    "artigo-opiniao",
    "talks",
    "one-talk",
    "big-talk",
    "little-talk",
    "shorts",
    "feed",
    "reels",
    "react",
    "social-video-testemunhal",
}

METRICAS_STATUS_VALIDOS = {
    "pendente",
    "sucesso",
    "erro",
    "manual",
}

METRICAS_ORIGEM_VALIDAS = {
    "manual",
    "ga4",
}


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
    imagem_url: Optional[str] = None
    conteudos_vinculados_ids: list[str] = Field(default_factory=list)

    @field_validator("nome_projeto", "canal", "tipo", "link", mode="before")
    @classmethod
    def validar_textos_obrigatorios(cls, value):
        if value is None:
            raise ValueError("Campo obrigatório")
        if isinstance(value, str):
            value = value.strip()
        if not value:
            raise ValueError("Campo obrigatório")
        return value

    @field_validator("segmento", "cliente", "descricao", "imagem_url", mode="before")
    @classmethod
    def normalizar_textos_opcionais(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return value

    @field_validator("canal")
    @classmethod
    def validar_canal(cls, value: str):
        if value not in CANAIS_VALIDOS:
            raise ValueError("Canal inválido")
        return value

    @field_validator("tipo")
    @classmethod
    def validar_tipo(cls, value: str):
        if value not in TIPOS_VALIDOS:
            raise ValueError("Tipo inválido")
        return value

    @field_validator("visualizacoes")
    @classmethod
    def validar_visualizacoes(cls, value: Optional[int]):
        if value is not None and value < 0:
            raise ValueError("Visualizações não pode ser negativo")
        return value


    @field_validator("conteudos_vinculados_ids", mode="before")
    @classmethod
    def normalizar_conteudos_vinculados_ids(cls, value):
        if value is None:
            return []
        if not isinstance(value, list):
            raise ValueError("Vinculos precisam ser uma lista")

        ids: list[str] = []
        for item in value:
            if item is None:
                continue
            item = str(item).strip()
            if item and item not in ids:
                ids.append(item)
        return ids


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
    imagem_url: Optional[str] = None
    conteudos_vinculados_ids: Optional[list[str]] = None

    @field_validator("nome_projeto", "canal", "tipo", "link", mode="before")
    @classmethod
    def validar_textos_update(cls, value):
        if value is None:
            return value
        if isinstance(value, str):
            value = value.strip()
        return value

    @field_validator("segmento", "cliente", "descricao", "imagem_url", mode="before")
    @classmethod
    def normalizar_textos_opcionais_update(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return value

    @field_validator("canal")
    @classmethod
    def validar_canal_update(cls, value: Optional[str]):
        if value is None:
            return value
        if value not in CANAIS_VALIDOS:
            raise ValueError("Canal inválido")
        return value

    @field_validator("tipo")
    @classmethod
    def validar_tipo_update(cls, value: Optional[str]):
        if value is None:
            return value
        if value not in TIPOS_VALIDOS:
            raise ValueError("Tipo inválido")
        return value

    @field_validator("visualizacoes")
    @classmethod
    def validar_visualizacoes_update(cls, value: Optional[int]):
        if value is not None and value < 0:
            raise ValueError("Visualizações não pode ser negativo")
        return value


    @field_validator("conteudos_vinculados_ids", mode="before")
    @classmethod
    def normalizar_conteudos_vinculados_ids_update(cls, value):
        if value is None:
            return value
        if not isinstance(value, list):
            raise ValueError("Vinculos precisam ser uma lista")

        ids: list[str] = []
        for item in value:
            if item is None:
                continue
            item = str(item).strip()
            if item and item not in ids:
                ids.append(item)
        return ids


class ConteudoMetricasUpdate(BaseModel):
    visualizacoes: Optional[int] = None
    metricas_status: str = "pendente"
    metricas_origem: Optional[str] = None
    metricas_erro: Optional[str] = None

    @field_validator("visualizacoes")
    @classmethod
    def validar_visualizacoes_metricas(cls, value: Optional[int]):
        if value is not None and value < 0:
            raise ValueError("Visualizações não pode ser negativo")
        return value

    @field_validator("metricas_status")
    @classmethod
    def validar_metricas_status(cls, value: str):
        value = value.strip().lower()
        if value not in METRICAS_STATUS_VALIDOS:
            raise ValueError("Status de métricas inválido")
        return value

    @field_validator("metricas_origem")
    @classmethod
    def validar_metricas_origem(cls, value: Optional[str]):
        if value is None:
            return value
        value = value.strip().lower()
        if value not in METRICAS_ORIGEM_VALIDAS:
            raise ValueError("Origem de métricas inválida")
        return value

    @field_validator("metricas_erro", mode="before")
    @classmethod
    def normalizar_metricas_erro(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return value


class ConteudoMetricasPreviewIn(BaseModel):
    url: str = Field(min_length=1)

    @field_validator("url", mode="before")
    @classmethod
    def validar_url(cls, value):
        if value is None:
            raise ValueError("URL obrigatória")
        if isinstance(value, str):
            value = value.strip()
        if not value:
            raise ValueError("URL obrigatória")
        return value


class ConteudoMetricasPreviewOut(BaseModel):
    visualizacoes: int
    metricas_status: str
    metricas_origem: str
    views_atualizadas_em: datetime
    metricas_erro: Optional[str] = None


class ConteudoRelacionadoOut(BaseModel):
    id: str
    nome_projeto: str
    canal: str
    tipo: str
    link: str

    class Config:
        from_attributes = True


class ConteudoOut(ConteudoBase):
    id: str
    metricas_status: str
    metricas_origem: Optional[str] = None
    views_atualizadas_em: Optional[datetime] = None
    metricas_erro: Optional[str] = None
    conteudos_vinculados: list[ConteudoRelacionadoOut] = Field(default_factory=list)
    created_at: datetime

    class Config:
        from_attributes = True
