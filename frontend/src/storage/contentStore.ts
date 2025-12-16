import type { ProjetoConteudo } from "../domain/models";
import { apiDelete, apiGet, apiPost, apiPut } from "../services/api";

// Contrato do backend (snake_case)
type ConteudoApi = {
  id: string;
  nome_projeto: string;
  canal: string;
  tipo: string;
  visualizacoes?: number | null;
  segmento?: string | null;
  data_publicacao?: string | null; // yyyy-mm-dd
  cliente?: string | null;
  link: string;
  descricao?: string | null;
  created_at: string;
};

function fromApi(x: ConteudoApi): ProjetoConteudo {
  return {
    id: x.id,
    nomeProjeto: x.nome_projeto,
    canal: x.canal as any,
    tipo: x.tipo as any,
    visualizacoes: x.visualizacoes ?? null,
    segmento: x.segmento ?? null,
    dataPublicacao: x.data_publicacao ?? null,
    cliente: x.cliente ?? null,
    link: x.link,
    descricao: x.descricao ?? null,
    createdAt: x.created_at,
  };
}

function toApi(payload: Omit<ProjetoConteudo, "id" | "createdAt">) {
  return {
    nome_projeto: payload.nomeProjeto,
    canal: payload.canal,
    tipo: payload.tipo,
    visualizacoes: payload.visualizacoes ?? null,
    segmento: payload.segmento ?? null,
    data_publicacao: payload.dataPublicacao ?? null,
    cliente: payload.cliente ?? null,
    link: payload.link,
    descricao: payload.descricao ?? null,
  };
}

export const contentStore = {
  async query(opts: { canal?: string; tipo?: string; q?: string }) {
    const params = new URLSearchParams();
    if (opts.canal) params.set("canal", opts.canal);
    if (opts.tipo) params.set("tipo", opts.tipo);
    if (opts.q) params.set("q", opts.q);
    params.set("limit", "200");
    params.set("offset", "0");

    const data = await apiGet<ConteudoApi[]>(`/conteudos?${params.toString()}`);
    return data.map(fromApi);
  },

  async create(payload: Omit<ProjetoConteudo, "id" | "createdAt">) {
    const created = await apiPost<ConteudoApi>("/conteudos", toApi(payload));
    return fromApi(created);
  },

  async update(id: string, payload: Omit<ProjetoConteudo, "id" | "createdAt">) {
    const updated = await apiPut<ConteudoApi>(`/conteudos/${id}`, toApi(payload));
    return fromApi(updated);
  },

  async remove(id: string) {
    await apiDelete(`/conteudos/${id}`);
  },
};
