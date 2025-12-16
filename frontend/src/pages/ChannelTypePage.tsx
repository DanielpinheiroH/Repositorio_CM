import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { contentStore } from "../storage/contentStore";
import { canalLabel, tipoLabel } from "../domain/contentTypes";
import type { ProjetoConteudo } from "../domain/models";
import { NewProjectModal } from "../components/NewProjectModal";

type FormValue = Omit<ProjetoConteudo, "id" | "createdAt">;

function compactUrl(url: string) {
  try {
    const u = new URL(url);
    const path = u.pathname.length > 28 ? u.pathname.slice(0, 28) + "…" : u.pathname;
    return `${u.host}${path}${u.search ? "?" : ""}`;
  } catch {
    return url.replace(/^https?:\/\//, "").slice(0, 42);
  }
}

function formatDateBR(value?: string | null) {
  const v = (value || "").trim();
  if (!v) return "";
  // esperado: YYYY-MM-DD
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  // fallback: tenta Date()
  const d = new Date(v);
  if (!Number.isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  return v;
}

export function ChannelTypePage() {
  const { canal, tipo } = useParams();

  const [q, setQ] = useState("");

  // filtros
  const [segmento, setSegmento] = useState<string>("");
  const [cliente, setCliente] = useState<string>("");

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

  const segmentosDisponiveis = useMemo(() => {
    const s = new Set<string>();
    for (const it of items) {
      const v = (it.segmento || "").trim();
      if (v) s.add(v);
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const clientesDisponiveis = useMemo(() => {
    const s = new Set<string>();
    for (const it of items) {
      const v = (it.cliente || "").trim();
      if (v) s.add(v);
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      const segOk = !segmento || (it.segmento || "").trim() === segmento;
      const cliOk = !cliente || (it.cliente || "").trim() === cliente;
      return segOk && cliOk;
    });
  }, [items, segmento, cliente]);

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
      await fetchData();
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
      await fetchData();
    } catch (e: any) {
      alert(`Erro ao excluir: ${String(e?.message || e)}`);
    }
  }

  return (
    <div className="space-y-3">
      {/* topo responsivo */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <div className="text-lg font-extrabold text-white">{title}</div>
          <div className="text-xs text-zinc-400 mt-1">
            Cadastros criados via “Novo Projeto” entram automaticamente nesta lista.
          </div>
        </div>

        <input
          className="w-full lg:max-w-xl rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none focus:border-red-500/40"
          placeholder="Buscar por nome, cliente, segmento, descrição..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* filtros responsivos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none text-zinc-200"
          value={segmento}
          onChange={(e) => setSegmento(e.target.value)}
          disabled={loading}
          title="Filtrar por segmento"
        >
          <option value="">Todos os segmentos</option>
          {segmentosDisponiveis.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none text-zinc-200"
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
          disabled={loading}
          title="Filtrar por cliente"
        >
          <option value="">Todos os clientes</option>
          {clientesDisponiveis.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* status */}
      {loading ? (
        <div className="text-zinc-400">Carregando...</div>
      ) : err ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          Erro ao buscar conteúdos: {err}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredItems.map((it) => {
            const dataBR = formatDateBR(it.dataPublicacao);

            return (
              <div
                key={it.id}
                className="
                  rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4
                  transition hover:border-red-500/25 hover:bg-zinc-900/55 hover:shadow-lg
                "
              >
                {/* topo do card responsivo */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-extrabold text-white text-lg truncate">
                      {it.nomeProjeto}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                      <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-white/5 px-2 py-1 text-zinc-200">
                        {canalLabel(String(it.canal || ""))}
                      </span>

                      <span className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-2 py-1 text-red-100">
                        {tipoLabel(String(it.canal || ""), String(it.tipo || ""))}
                      </span>

                      {it.segmento ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-white/5 px-2 py-1 text-zinc-200">
                          {it.segmento}
                        </span>
                      ) : null}

                      {dataBR ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-white/5 px-2 py-1 text-zinc-300">
                          {dataBR}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* views (no mobile fica abaixo automaticamente) */}
                  <div className="shrink-0 sm:text-right">
                    <div className="text-[10px] text-zinc-400">VIEWS</div>
                    <div className="mt-1 w-fit sm:ml-auto rounded-xl border border-red-500/25 bg-red-500/10 px-2 py-1 text-sm font-bold text-red-100">
                      {typeof it.visualizacoes === "number" ? it.visualizacoes : "—"}
                    </div>
                  </div>
                </div>

                {/* cliente */}
                <div className="mt-3 text-xs text-zinc-400">
                  <span className="text-zinc-500">Cliente:</span>{" "}
                  <span className="text-zinc-200">{it.cliente || "—"}</span>
                </div>

                {/* descrição */}
                {it.descricao ? (
                  <div className="mt-3 text-sm text-zinc-200/90 leading-relaxed line-clamp-3">
                    {it.descricao}
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-zinc-500 italic">Sem descrição.</div>
                )}

                {/* link compacto */}
                <div className="mt-3 text-[11px] text-zinc-500 truncate">
                  {it.link ? compactUrl(it.link) : ""}
                </div>

                {/* ações responsivas */}
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2">
                  <a
                    className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-red-600 bg-red-500/10 hover:bg-red-500/20 text-sm text-white transition-all"
                    href={it.link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir Link
                  </a>

                  <button
                    className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-zinc-800 bg-white/5 hover:bg-white/10 text-sm text-white transition-all"
                    onClick={() => openEdit(it)}
                  >
                    Editar
                  </button>

                  <button
                    className="
                      sm:ml-auto
                      inline-flex items-center justify-center px-4 py-2 rounded-xl
                      border border-red-500/30 bg-red-500/10 hover:bg-red-500/15
                      text-sm text-red-200 transition-all
                    "
                    onClick={() => handleDelete(it)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-zinc-800 p-6 text-zinc-400">
              Nenhum conteúdo encontrado com os filtros selecionados.
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
