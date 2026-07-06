import type { CanalKey, TipoKey } from "./contentTypes";

export type ConteudoRelacionado = {
  id: string;
  nomeProjeto: string;
  canal: CanalKey;
  tipo: TipoKey;
  link: string;
};

export type ProjetoConteudo = {
  id: string;

  nomeProjeto: string;

  canal: CanalKey;
  tipo: TipoKey;

  visualizacoes?: number | null;
  segmento?: string | null;
  dataPublicacao?: string | null;
  cliente?: string | null;

  link: string;
  descricao?: string | null;
  imagemUrl?: string | null;
  conteudosVinculados?: ConteudoRelacionado[];
  conteudosVinculadosIds?: string[];

  createdAt: string;
};
