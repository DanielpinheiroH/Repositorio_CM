import type { CanalKey, TipoKey } from "./contentTypes";

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

  createdAt: string;
};