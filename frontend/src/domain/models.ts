import type { CanalKey, TipoKey } from "./contentTypes";

export type ProjetoConteudo = {
  id: string;

  nomeProjeto: string;

  canal: CanalKey;
  tipo: TipoKey;

  visualizacoes?: number | null;
  segmento?: string | null;
  dataPublicacao?: string | null; // yyyy-mm-dd
  cliente?: string | null;

  link: string;
  descricao?: string | null;

  createdAt: string; // ISO
};
