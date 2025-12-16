import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { contentStore } from "../storage/contentStore";
import { canalLabel, tipoLabel } from "../domain/contentTypes";

export function ChannelTypePage() {
  const { canal, tipo } = useParams();
  const [q, setQ] = useState("");

  const title = useMemo(() => {
    return `${canalLabel(canal || "")} • ${tipoLabel(canal || "", tipo || "")}`;
  }, [canal, tipo]);

  const items = useMemo(() => {
    return contentStore.query({ canal, tipo, q });
  }, [canal, tipo, q]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-extrabold text-white">{title}</div>
          <div className="text-xs text-zinc-400 mt-1">
            Cadastros criados via “Novo Projeto” entram automaticamente nesta lista.
          </div>
        </div>

        <input
          className="w-full max-w-xl rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none"
          placeholder="Buscar por nome, cliente, segmento, descrição..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {items.map((it) => (
          <div
            key={it.id}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3"
          >
            <div className="font-extrabold text-white">{it.nomeProjeto}</div>

            <div className="text-xs text-zinc-400 flex flex-wrap gap-2">
              <span>Cliente: {it.cliente || "—"}</span>
              {it.dataPublicacao ? <span>• Publicação: {it.dataPublicacao}</span> : null}
              {typeof it.visualizacoes === "number" ? <span>• Views: {it.visualizacoes}</span> : null}
              {it.segmento ? <span>• Segmento: {it.segmento}</span> : null}
            </div>

            {it.descricao ? (
              <div className="text-sm text-zinc-200/90">{it.descricao}</div>
            ) : null}

            <div className="pt-2">
              <a
                className="inline-flex items-center justify-center px-3 py-2 rounded-xl border border-zinc-800 bg-white/5 hover:bg-white/10"
                href={it.link}
                target="_blank"
                rel="noreferrer"
              >
                Abrir Link
              </a>
            </div>
          </div>
        ))}

        {items.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-zinc-800 p-6 text-zinc-400">
            Nenhum conteúdo cadastrado aqui ainda. Clique em “Novo Projeto” para criar o primeiro.
          </div>
        ) : null}
      </div>
    </div>
  );
}
