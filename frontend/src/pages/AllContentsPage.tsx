import { useEffect, useMemo, useState } from "react";
import { contentStore } from "../storage/contentStore";
import type { ProjetoConteudo } from "../domain/models";
import { NewProjectModal } from "../components/NewProjectModal";

type FormValue = Omit<ProjetoConteudo, "id" | "createdAt">;

export function AllContentsPage() {
  const [q, setQ] = useState("");
  const [canal, setCanal] = useState<string>("");
  const [tipo, setTipo] = useState<string>("");

  const [items, setItems] = useState<ProjetoConteudo[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<ProjetoConteudo | null>(null);
  const [saving, setSaving] = useState(false);

  const count = useMemo(() => items.length, [items]);

  async function fetchData() {
    setLoading(true);
    setErr(null);
    try {
      const data = await contentStore.query({
        canal: canal || undefined,
        tipo: tipo || undefined,
        q: q || undefined,
      });
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
  }, [q, canal, tipo]);

  function openCreate() {
    setModalMode("create");
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(item: ProjetoConteudo) {
    setModalMode("edit");
    setEditing(item);
    setModalOpen(true);
  }

  async function handleSave(payload: FormValue) {
    try {
      setSaving(true);

      if (modalMode === "edit" && editing) {
        await contentStore.update(editing.id, payload);
      } else {
        await contentStore.create(payload);
      }

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
    <div className="space-y-4">
      {/* HEADER DA TELA */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <div className="text-xl font-extrabold text-white">Todos os Conteúdos</div>
            <div className="text-xs text-zinc-400 mt-1">
              Repositório geral para consulta rápida de exemplos comerciais por canal e formato.
            </div>

            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1">
              <span className="text-xs text-zinc-400">Total:</span>
              <span className="text-xs font-semibold text-white">{loading ? "—" : count}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2 rounded-xl border border-zinc-800 bg-white/5 hover:bg-white/10 text-white font-semibold"
              onClick={() => {
                setQ("");
                setCanal("");
                setTipo("");
              }}
              disabled={loading}
              title="Limpar filtros"
            >
              Limpar
            </button>

            <button
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-60"
              onClick={openCreate}
              disabled={saving}
            >
              Novo Projeto
            </button>
          </div>
        </div>

        {/* FILTROS */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
          <input
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 outline-none"
            placeholder="Buscar em tudo (nome, cliente, segmento, descrição, link)..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 outline-none"
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
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 outline-none"
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
      </div>

      {/* ESTADOS */}
      {loading ? (
        <div className="text-zinc-400">Carregando...</div>
      ) : err ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          Erro ao buscar conteúdos: {err}
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-zinc-900/40 text-xs text-zinc-400 border-b border-zinc-800">
            <div className="col-span-4">Projeto</div>
            <div className="col-span-2">Canal/Tipo</div>
            <div className="col-span-2">Cliente</div>
            <div className="col-span-2">Views</div>
            <div className="col-span-2 text-right">Ações</div>
          </div>

          {items.map((it) => (
            <div
              key={it.id}
              className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-zinc-800/60 bg-zinc-950 items-center"
            >
              <div className="col-span-4 font-semibold text-white truncate">{it.nomeProjeto}</div>
              <div className="col-span-2 text-sm text-zinc-300 truncate">
                {it.canal} / {it.tipo}
              </div>
              <div className="col-span-2 text-sm text-zinc-300 truncate">{it.cliente || "—"}</div>
              <div className="col-span-2 text-sm text-zinc-300">
                {typeof it.visualizacoes === "number" ? it.visualizacoes : "—"}
              </div>

              <div className="col-span-2 flex items-center justify-end gap-2">
                <a
                  className="px-3 py-2 rounded-xl border border-zinc-800 bg-white/5 hover:bg-white/10 text-sm"
                  href={it.link}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir
                </a>

                <button
                  className="px-3 py-2 rounded-xl border border-zinc-800 bg-white/5 hover:bg-white/10 text-sm"
                  onClick={() => openEdit(it)}
                >
                  Editar
                </button>

                <button
                  className="px-3 py-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/15 text-sm text-red-200"
                  onClick={() => handleDelete(it)}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}

          {items.length === 0 ? (
            <div className="p-6 text-zinc-400 bg-zinc-950">
              Nenhum conteúdo encontrado com esses filtros.
            </div>
          ) : null}
        </div>
      )}

      <NewProjectModal
        open={modalOpen}
        mode={modalMode}
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
...