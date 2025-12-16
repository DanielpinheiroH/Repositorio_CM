import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { contentStore } from "../storage/contentStore";
import { canalLabel, tipoLabel } from "../domain/contentTypes";
import type { ProjetoConteudo } from "../domain/models";
import { NewProjectModal } from "../components/NewProjectModal";

type FormValue = Omit<ProjetoConteudo, "id" | "createdAt">;

export function ChannelTypePage() {
  const { canal, tipo } = useParams();
  const [q, setQ] = useState("");

  const [items, setItems] = useState<ProjetoConteudo[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProjetoConteudo | null>(null);
  const [saving, setSaving] = useState(false);

  const title = useMemo(() => {
    return `${canalLabel(canal || "")} • ${tipoLabel(canal || "", tipo || "")}`;
  }, [canal, tipo]);

  async function fetchData() {
    setLoading(true);
    setErr(null);
    try {
      const data = await contentStore.query({ canal, tipo, q });
      setItems(data);
    } catch (e: any) {
      setErr(String(e?.message || e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canal, tipo, q]);

  function openEdit(item: ProjetoConteudo) {
    setEditing(item);
    setModalOpen(true);
  }

  async function handleSave(payload: FormValue) {
    if (!editing) return;

    try {
      setSaving(true);
      await contentStore.update(editing.id, payload);
      setModalOpen(false);
      setEditing(null);
      await fetchData(); // refresh automático
    } catch (e: any) {
      alert(`Erro ao salvar: ${String(e?.message || e)}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: ProjetoConteudo) {
    const ok = confirm(`Excluir "${item.nomeProjeto}"? Essa ação não pode ser desfeita.`);
    if (!ok) return;

    try {
      await contentStore.remove(item.id);
      await fetchData(); // refresh automático
    } catch (e: any) {
      alert(`Erro ao excluir: ${String(e?.message || e)}`);
    }
  }

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

      {loading ? (
        <div className="text-zinc-400">Carregando...</div>
      ) : err ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          Erro ao buscar conteúdos: {err}
        </div>
      ) : (
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
                {typeof it.visualizacoes === "number" ? (
                  <span>• Views: {it.visualizacoes}</span>
                ) : null}
                {it.segmento ? <span>• Segmento: {it.segmento}</span> : null}
              </div>

              {it.descricao ? <div className="text-sm text-zinc-200/90">{it.descricao}</div> : null}

              <div className="pt-2 flex items-center gap-2">
                <a
                  className="inline-flex items-center justify-center px-3 py-2 rounded-xl border border-zinc-800 bg-white/5 hover:bg-white/10 text-sm"
                  href={it.link}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir Link
                </a>

                <button
                  className="inline-flex items-center justify-center px-3 py-2 rounded-xl border border-zinc-800 bg-white/5 hover:bg-white/10 text-sm"
                  onClick={() => openEdit(it)}
                >
                  Editar
                </button>

                <button
                  className="inline-flex items-center justify-center px-3 py-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/15 text-sm text-red-200"
                  onClick={() => handleDelete(it)}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}

          {items.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-zinc-800 p-6 text-zinc-400">
              Nenhum conteúdo encontrado aqui ainda. Clique em “Novo Projeto” para criar o primeiro.
            </div>
          ) : null}
        </div>
      )}

      <NewProjectModal
        open={modalOpen}
        mode="edit"
        saving={saving}
        initialValue={
          editing
            ? {
                nomeProjeto: editing.nomeProjeto,
                canal: editing.canal,
                tipo: editing.tipo,
                visualizacoes: editing.visualizacoes ?? null,
                segmento: editing.segmento ?? "",
                dataPublicacao: editing.dataPublicacao ?? "",
                cliente: editing.cliente ?? "",
                link: editing.link,
                descricao: editing.descricao ?? "",
              }
            : null
        }
        onClose={() => {
          if (saving) return;
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />
    </div>
  );
}
