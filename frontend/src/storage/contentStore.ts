import type { ProjetoConteudo } from "../domain/models";

const KEY = "REPOSITORIO_CM_CONTEUDOS_V1";

function safeRead(): ProjetoConteudo[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ProjetoConteudo[];
  } catch {
    return [];
  }
}

function safeWrite(items: ProjetoConteudo[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export const contentStore = {
  list(): ProjetoConteudo[] {
    return safeRead().sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  },

  create(payload: Omit<ProjetoConteudo, "id" | "createdAt">): ProjetoConteudo {
    const items = safeRead();
    const item: ProjetoConteudo = {
      ...payload,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    items.push(item);
    safeWrite(items);
    return item;
  },

  query(opts: { canal?: string; tipo?: string; q?: string }): ProjetoConteudo[] {
    const { canal, tipo, q } = opts;
    const term = (q || "").trim().toLowerCase();

    return this.list().filter((it) => {
      if (canal && it.canal !== canal) return false;
      if (tipo && it.tipo !== tipo) return false;

      if (!term) return true;

      const blob = [
        it.nomeProjeto,
        it.cliente,
        it.segmento,
        it.descricao,
        it.link,
        it.canal,
        it.tipo,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return blob.includes(term);
    });
  },
};
