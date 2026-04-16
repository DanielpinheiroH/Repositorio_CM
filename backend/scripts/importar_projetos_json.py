import json
import sys
from pathlib import Path
from typing import Any
from uuid import uuid4

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

print("SCRIPT INICIADO")
print("BASE_DIR:", BASE_DIR)
print("ARGV:", sys.argv)

from sqlalchemy import select  # noqa: E402
from app.database import SessionLocal  # noqa: E402
from app.models import Conteudo  # noqa: E402

CANAL_PADRAO = "site"
TIPO_PADRAO = "conteudo-de-marca"


def limpar_texto(value: Any) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        value = str(value)
    value = value.strip()
    return value or None


def carregar_json(caminho_arquivo: Path) -> list[dict[str, Any]]:
    print("Lendo JSON de:", caminho_arquivo)

    if not caminho_arquivo.exists():
        raise FileNotFoundError(f"Arquivo não encontrado: {caminho_arquivo}")

    with caminho_arquivo.open("r", encoding="utf-8") as f:
        data = json.load(f)

    print("Tipo do JSON:", type(data).__name__)

    if not isinstance(data, list):
        raise ValueError("O JSON precisa ser uma lista de objetos.")

    print("Total de itens no JSON:", len(data))
    return data


def buscar_por_link(db, link: str) -> Conteudo | None:
    stmt = select(Conteudo).where(Conteudo.link == link)
    return db.execute(stmt).scalars().first()


def importar_projetos(caminho_json: Path):
    data = carregar_json(caminho_json)

    db = SessionLocal()

    criados = 0
    atualizados = 0
    ignorados = 0
    erros = 0

    try:
        for i, item in enumerate(data, start=1):
            try:
                title = limpar_texto(item.get("title"))
                link = limpar_texto(item.get("link"))
                excerpt = limpar_texto(item.get("excerpt"))
                media_item_url = limpar_texto(item.get("mediaItemUrl"))

                if not title or not link:
                    ignorados += 1
                    print(f"[{i}] Ignorado: faltando title ou link")
                    continue

                existente = buscar_por_link(db, link)

                if existente:
                    existente.nome_projeto = title
                    existente.descricao = excerpt
                    existente.imagem_url = media_item_url
                    existente.canal = CANAL_PADRAO
                    existente.tipo = TIPO_PADRAO
                    atualizados += 1
                    print(f"[{i}] Atualizado: {title}")
                else:
                    novo = Conteudo(
                        id=uuid4().hex,
                        nome_projeto=title,
                        canal=CANAL_PADRAO,
                        tipo=TIPO_PADRAO,
                        visualizacoes=None,
                        segmento=None,
                        data_publicacao=None,
                        cliente=None,
                        link=link,
                        descricao=excerpt,
                        imagem_url=media_item_url,
                        metricas_status="pendente",
                        metricas_origem=None,
                        views_atualizadas_em=None,
                        metricas_erro=None,
                    )
                    db.add(novo)
                    criados += 1
                    print(f"[{i}] Criado: {title}")

            except Exception as e:
                erros += 1
                print(f"[{i}] Erro ao processar item: {e}")

        db.commit()

        print("\n===== RESUMO =====")
        print(f"Criados: {criados}")
        print(f"Atualizados: {atualizados}")
        print(f"Ignorados: {ignorados}")
        print(f"Erros: {erros}")

    except Exception as e:
        db.rollback()
        print("ERRO GERAL:", e)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("ENTROU NO MAIN")

    if len(sys.argv) < 2:
        print("Uso:")
        print("python scripts/importar_projetos_json.py caminho/do/arquivo.json")
        sys.exit(1)

    arquivo_json = Path(sys.argv[1]).resolve()
    importar_projetos(arquivo_json)