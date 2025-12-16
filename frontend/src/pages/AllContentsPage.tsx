import { useEffect, useMemo, useState } from "react";
import { contentStore } from "../storage/contentStore";
import type { ProjetoConteudo } from "../domain/models";
import { NewProjectModal } from "../components/NewProjectModal";

type FormValue = Omit<ProjetoConteudo, "id" | "createdAt">;

type TipoOpt = { value: string; label: string };

function tiposPorCanal(canal: string): TipoOpt[] {
  if (!canal) {
    // Todos os tipos (global)
    return [
      { value: "publieditorial", label: "Publieditorial" },
      { value: "manchete", label: "Manchete" },
      { value: "artigo-opiniao", label: "Artigo de opinião" },
      // YouTube
      { value: "talks", label: "TALKS" },
      { value: "one-talk", label: "ONE TALK" },
      { value: "big-talk", label: "BIG TALK" },
      { value: "little-talk", label: "LITTLE TALK" },
      { value: "shorts", label: "SHORTS" },
      // Instagram
      { value: "feed-reels", label: "Feed & Reels" },
      { value: "stories", label: "Stories" },
      // TikTok / Kwai / Facebook
      { value: "feed", label: "Feed" },
    ];
  }

  if (canal === "site") {
    return [
      { value: "publieditorial", label: "Publieditorial" },
      { value: "manchete", label: "Manchete" },
      { value: "artigo-opiniao", label: "Artigo de opinião" },
      // se você adicionar depois: publicidade nativa
      // { value: "publicidade-nativa", label: "Publicidade nativa" },
    ];
  }

  if (canal === "youtube") {
    return [
      { value: "talks", label: "TALKS" },
      { value: "one-talk", label: "ONE TALK" },
      { value: "big-talk", label: "BIG TALK" },
      { value: "little-talk", label: "LITTLE TALK" },
      { value: "shorts", label: "SHORTS" },
    ];
  }

  if (canal === "instagram") {
    return [
      { value: "feed-reels", label: "Feed & Reels" },
      { value: "stories", label: "Stories" },
    ];
  }

  // TikTok / Kwai / Facebook
  return [{ value: "feed", label: "Feed" }];
}

export function AllContentsPage() {
  const [q, setQ] = useState("");
  const [canal, setCanal] = useState<string>("");
  const [tipo, setTipo] = useState<string>("");

  // ✅ filtro por segmento
  const [segmento, setSegmento] = useState<string>("");

  const [rawItems, setRawItems] = useState<ProjetoConteudo[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<ProjetoConteudo | null>(null);
  const [saving, setSaving] = useState(false);

  // ====== UI styles (mantendo padrão "antigo") ======
  const baseInput =
    "w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none";
  const baseSelect =
    "w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none";
  const baseBtn =
    "px-3 py-2 rounded-xl border border-zinc-800 bg-white/5 hover:bg-white/10 text-white";
  const primaryBtn =
    "px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold";

  async function fetchData() {
    setLoading(true);
    setErr(null);
    try {
      const data = await contentStore.query({
        canal: canal || undefined,
        tipo: tipo || undefined,
        q: q || undefined,
      });
      setRawItems(data);
    } catch (e: any) {
      setErr(String(e?.message || e));
      setRawItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, canal, tipo]);

  // ✅ Tipos dependentes do canal selecionado
  const tiposDisponiveis = useMemo(() => {
    return tiposPorCanal(canal);
  }, [canal]);

  // ✅ Se trocar canal e o tipo atual não existir mais, reseta tipo
  useEffect(() => {
    if (!tipo) return; // vazio sempre é válido
    const allowed = tiposDisponiveis.map((t) => t.value);
    if (!allowed.includes(tipo)) {
      setTipo("");
    }
  }, [canal, tiposDisponiveis, tipo]);

  // ✅ lista de segmentos existentes
  const segmentosDisponiveis = useMemo(() => {
    const s = new Set<string>();
    for (const it of rawItems) {
      const seg = (it.segmento || "").trim();
      if (seg) s.add(seg);
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [rawItems]);

  // ✅ aplica filtro por segmento sem mudar backend
  const items = useMemo(() => {
    if (!segmento) return rawItems;
    return rawItems.filter((it) => (it.segmento || "").trim() === segmento);
  }, [rawItems, segmento]);

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
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-extrabold text-white">Todos os Conteúdos</div>
          <div className="text-xs text-zinc-400 mt-1">
            Busca e filtros globais em todos os canais
          </div>
        </div>

        <button className={primaryBtn} onClick={openCreate} disabled={saving}>
          Novo Projeto
        </button>
      </div>

      {/* Filtros (mesmo layout, Tipo agora depende do Canal) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <input
          className={baseInput}
          placeholder="Buscar em tudo (nome, cliente, segmento, descrição...)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <select
          className={baseSelect}
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

        {/* ✅ Tipo dependente do canal */}
        <select
          className={baseSelect}
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          disabled={loading}
        >
          <option value="">
            {canal ? "Todos os tipos do canal" : "Todos os tipos"}
          </option>

          {tiposDisponiveis.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        {/* Segmento */}
        <select
          className={baseSelect}
          value={segmento}
          onChange={(e) => setSegmento(e.target.value)}
          disabled={loading || segmentosDisponiveis.length === 0}
        >
          <option value="">Todos os segmentos</option>
          {segmentosDisponiveis.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Ações rápidas */}
      <div className="flex items-center gap-2">
        <button
          className={baseBtn}
          onClick={() => {
            setQ("");
            setCanal("");
            setTipo("");
            setSegmento("");
          }}
          disabled={loading}
        >
          Limpar filtros
        </button>

        <button className={baseBtn} onClick={fetchData} disabled={loading}>
          Atualizar
        </button>

        <div className="text-xs text-zinc-400 ml-auto">
          {loading ? "Carregando..." : err ? `Erro: ${err}` : `${items.length} item(ns)`}
        </div>
      </div>

      {/* Lista */}
      <div className="rounded-2xl border border-zinc-800 overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-zinc-900/40 text-xs text-zinc-400 border-b border-zinc-800">
          <div className="col-span-4">Projeto</div>
          <div className="col-span-2">Canal/Tipo</div>
          <div className="col-span-2">Cliente</div>
          <div className="col-span-2">Segmento</div>
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

            <div className="col-span-2 text-sm text-zinc-400 truncate">{it.segmento || "—"}</div>

            <div className="col-span-2 flex items-center justify-end gap-2">
              <a className={baseBtn} href={it.link} target="_blank" rel="noreferrer">
                Abrir
              </a>

              <button className={baseBtn} onClick={() => openEdit(it)}>
                Editar
              </button>

              <button
                className="px-3 py-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/15 text-red-200"
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
