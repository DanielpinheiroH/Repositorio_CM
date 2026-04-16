import type { ProjetoConteudo } from "../domain/models";
import { apiDelete, apiGet, apiPost, apiPut } from "../services/api";

export type ConteudoComMetricas = ProjetoConteudo & {
  metricasStatus?: string | null;
  metricasOrigem?: string | null;
  viewsAtualizadasEm?: string | null;
  metricasErro?: string | null;
};

export type ConteudoMetricasPreview = {
  visualizacoes: number;
  metricasStatus: string;
  metricasOrigem: string;
  viewsAtualizadasEm: string;
  metricasErro?: string | null;
};

type ConteudoApi = {
  id: string;
  nome_projeto: string;
  canal: string;
  tipo: string;
  visualizacoes?: number | null;
  segmento?: string | null;
  data_publicacao?: string | null;
  cliente?: string | null;
  link: string;
  descricao?: string | null;
  imagem_url?: string | null;
  metricas_status?: string | null;
  metricas_origem?: string | null;
  views_atualizadas_em?: string | null;
  metricas_erro?: string | null;
  created_at: string;
};

type ConteudoMetricasPreviewApi = {
  visualizacoes: number;
  metricas_status: string;
  metricas_origem: string;
  views_atualizadas_em: string;
  metricas_erro?: string | null;
};

function fromApi(x: ConteudoApi): ConteudoComMetricas {
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
    metricasStatus: x.metricas_status ?? null,
    metricasOrigem: x.metricas_origem ?? null,
    viewsAtualizadasEm: x.views_atualizadas_em ?? null,
    metricasErro: x.metricas_erro ?? null,
    imagemUrl: x.imagem_url ?? null,
  };
}

function fromPreviewApi(x: ConteudoMetricasPreviewApi): ConteudoMetricasPreview {
  return {
    visualizacoes: x.visualizacoes,
    metricasStatus: x.metricas_status,
    metricasOrigem: x.metricas_origem,
    viewsAtualizadasEm: x.views_atualizadas_em,
    metricasErro: x.metricas_erro ?? null,
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
    imagem_url: payload.imagemUrl ?? null,
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

  async getById(id: string) {
    const data = await apiGet<ConteudoApi>(`/conteudos/${id}`);
    return fromApi(data);
  },

  async create(payload: Omit<ProjetoConteudo, "id" | "createdAt">) {
    const created = await apiPost<ConteudoApi>("/conteudos", toApi(payload));
    return fromApi(created);
  },

  async update(id: string, payload: Omit<ProjetoConteudo, "id" | "createdAt">) {
    const updated = await apiPut<ConteudoApi>(`/conteudos/${id}`, toApi(payload));
    return fromApi(updated);
  },

  async previewMetricas(url: string) {
    const data = await apiPost<ConteudoMetricasPreviewApi>("/conteudos/metricas-preview", {
      url,
    });
    return fromPreviewApi(data);
  },

  async updateMetricas(id: string) {
    const updated = await apiPost<ConteudoApi>(`/conteudos/${id}/metricas`, {});
    return fromApi(updated);
  },

  async remove(id: string) {
    await apiDelete(`/conteudos/${id}`);
  },
};