import { useMemo, useState } from "react";
import { contentStore } from "../storage/contentStore";

export function AllContentsPage() {
  const [q, setQ] = useState("");
  const [canal, setCanal] = useState<string>("");
  const [tipo, setTipo] = useState<string>("");

  const items = useMemo(() => {
    const term = q.trim().toLowerCase();

    return contentStore
      .list()
      .filter((it) => (canal ? it.canal === canal : true))
      .filter((it) => (tipo ? it.tipo === tipo : true))
      .filter((it) => {
        if (!term) return true;
        const blob = [it.nomeProjeto, it.cliente, it.segmento, it.descricao, it.link]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return blob.includes(term);
      });
  }, [q, canal, tipo]);

  return (
    <div className="space-y-3">
      {/* Layout diferente: filtros globais */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <input
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none lg:col-span-1"
          placeholder="Buscar em tudo (nome, cliente, segmento, descrição, link)..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <select
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none"
          value={canal}
          onChange={(e) => setCanal(e.target.value)}
        >
          <option value="">Todos os canais</option>
          <option value="site">Site/Portal</option>
          <option value="youtube">YouTube</option>
          <option value="instagram">Instagram</option>
          <option value="tiktok">TikTok</option>
          <option value="kwai">Kwai</option>
          <option value="facebook">Facebook</option>
        </select>

        <select
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        >
          <option value="">Todos os tipos</option>
          <option value="publieditorial">Publieditorial</option>
          <option value="manchete">Manchete</option>
          <option value="artigo-opiniao">Artigo de opinião</option>
          <option value="talks">TALKS</option>
          <option value="shorts">SHORTS</option>
          <option value="feed-reels">Feed & Reels</option>
          <option value="stories">Stories</option>
          <option value="feed">Feed</option>
        </select>
      </div>

      <div className="rounded-2xl border border-zinc-800 overflow-hidden">
        <div className="grid grid-cols-6 gap-3 px-4 py-3 bg-zinc-900/40 text-xs text-zinc-400 border-b border-zinc-800">
          <div className="col-span-2">Projeto</div>
          <div>Canal/Tipo</div>
          <div>Cliente</div>
          <div>Views</div>
          <div>Ações</div>
        </div>

        {items.map((it) => (
          <div
            key={it.id}
            className="grid grid-cols-6 gap-3 px-4 py-3 border-b border-zinc-800/60 bg-zinc-950"
          >
            <div className="col-span-2 font-semibold text-white">{it.nomeProjeto}</div>
            <div className="text-sm text-zinc-300">
              {it.canal} / {it.tipo}
            </div>
            <div className="text-sm text-zinc-300">{it.cliente || "—"}</div>
            <div className="text-sm text-zinc-300">
              {typeof it.visualizacoes === "number" ? it.visualizacoes : "—"}
            </div>
            <div>
              <a
                className="inline-flex items-center justify-center px-3 py-2 rounded-xl border border-zinc-800 bg-white/5 hover:bg-white/10 text-sm"
                href={it.link}
                target="_blank"
                rel="noreferrer"
              >
                Abrir
              </a>
            </div>
          </div>
        ))}

        {items.length === 0 ? (
          <div className="p-6 text-zinc-400 bg-zinc-950">
            Nenhum conteúdo encontrado com esses filtros.
          </div>
        ) : null}
      </div>
    </div>
  );
}
