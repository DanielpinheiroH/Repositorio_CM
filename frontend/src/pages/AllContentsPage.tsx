import { useEffect, useMemo, useState } from "react";
import { contentStore, type ConteudoComMetricas } from "../storage/contentStore";
import { NewProjectModal } from "../components/NewProjectModal";
import { canalLabel, tipoLabel } from "../domain/contentTypes";

type FormValue = Omit<
  ConteudoComMetricas,
  "id" | "createdAt" | "metricasStatus" | "metricasOrigem" | "viewsAtualizadasEm" | "metricasErro"
>;

type TipoOpt = { value: string; label: string };

const channelColors = {
  site: "#FFFFFF",
  instagram: "linear-gradient(135deg, #F58529, #DD2A7B, #8134AF)",
  youtube: "#FF0000",
  kwai: "#FF6A00",
  facebook: "#1877F2",
  tiktok: "#0F0F0F",
} as const;

function tiposPorCanal(canal: string): TipoOpt[] {
  if (!canal) {
    return [
      { value: "conteudo-de-marca", label: "Conteúdo de marca" },
      { value: "artigo-opiniao", label: "Artigo de opinião" },
      { value: "talks", label: "TALKS" },
      { value: "one-talk", label: "ONE TALK" },
      { value: "big-talk", label: "BIG TALK" },
      { value: "little-talk", label: "LITTLE TALK" },
      { value: "shorts", label: "SHORTS" },
      { value: "feed-reels", label: "Feed & Reels" },
      { value: "stories", label: "Stories" },
      { value: "feed", label: "Feed" },
    ];
  }

  if (canal === "site") {
    return [
      { value: "conteudo-de-marca", label: "Conteúdo de marca" },
      { value: "artigo-opiniao", label: "Artigo de opinião" },
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
    { value: "feed", label: "Feed" },
    { value: "reels", label: "Reels" },
  ];
}

  return [{ value: "feed", label: "Feed" }];
}

function formatViews(value?: number | null) {
  if (typeof value !== "number") return "—";
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatMetricasStatus(status?: string | null) {
  switch (status) {
    case "sucesso":
      return "Atualizado";
    case "erro":
      return "Erro";
    case "manual":
      return "Manual";
    default:
      return "Pendente";
  }
}

function metricasStatusClass(status?: string | null) {
  switch (status) {
    case "sucesso":
      return "text-emerald-700 bg-emerald-50 border-emerald-200";
    case "erro":
      return "text-rose-700 bg-rose-50 border-rose-200";
    case "manual":
      return "text-amber-700 bg-amber-50 border-amber-200";
    default:
      return "text-zinc-600 bg-zinc-50 border-zinc-200";
  }
}

function getChannelMeta(canal?: string | null) {
  switch (canal) {
    case "instagram":
      return {
        iconSrc: "/instagram.ico",
        shortName: "Instagram",
      };
    case "youtube":
      return {
        iconSrc: "/youtube.ico",
        shortName: "YouTube",
      };
    case "facebook":
      return {
        iconSrc: "/facebook.ico",
        shortName: "Facebook",
      };
    case "kwai":
      return {
        iconSrc: "/kwai.ico",
        shortName: "Kwai",
      };
    case "tiktok":
      return {
        iconSrc: "/tiktok.ico",
        shortName: "TikTok",
      };
    case "site":
    default:
      return {
        iconSrc: "/site.ico",
        shortName: "Site/Portal",
      };
  }
}

function channelCardTheme(canal?: string | null) {
  const color =
    channelColors[(canal as keyof typeof channelColors) || "site"] ||
    channelColors.site;

  const isGradient = String(color).startsWith("linear-gradient");
  const isWhite = color === "#FFFFFF";
  const isDark = color === "#0F0F0F";

  return {
    cardStyle: isGradient
      ? { backgroundImage: color }
      : { backgroundColor: color },

    accentStyle: isGradient
      ? { backgroundImage: color }
      : { backgroundColor: color },

    ribbonStyle: isGradient
      ? { backgroundImage: color, color: "#ffffff" }
      : isWhite
        ? { backgroundColor: "#ffffff", color: "#2b1820" }
        : { backgroundColor: color, color: "#ffffff" },

    borderClass: isWhite ? "border-[#e5e7eb]" : "border-transparent",

    channelBadgeClass: "bg-white text-[#2b1820] border-white/80",

    contentClass: isWhite ? "bg-white/95" : "bg-white/96",

    imageFallbackClass: isWhite
      ? "bg-[#f8f8f8] text-[#a1a1aa]"
      : "bg-white/20 text-white/80",

    innerSurfaceClass: "bg-[#fffafb] border-[#efe3e6]",

    sideGlowClass: isDark
      ? "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
      : "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.24)]",

    titleClass: isWhite ? "text-[#2b1820]" : "text-white",

    channelPillClass: isWhite
      ? "bg-[#fff3f5] text-[#a31320] border-[#f0cfd5]"
      : "bg-white/18 text-white border-white/20",

    typePillClass: isWhite
      ? "bg-[#fff6ea] text-[#a35a00] border-[#f1d6aa]"
      : "bg-white text-[#8f2431] border-white/60",

    segmentPillClass: isWhite
      ? "bg-[#f7f4ff] text-[#5d3ea8] border-[#ddd2ff]"
      : "bg-white/92 text-[#4a2f84] border-white/70",
  };
}

type ContentCardProps = {
  item: ConteudoComMetricas;
  onOpenImage: (src?: string | null, title?: string) => void;
  onEdit: (item: ConteudoComMetricas) => void;
  onDelete: (item: ConteudoComMetricas) => void;
  onRefreshMetricas: (item: ConteudoComMetricas) => void;
  imageHeightClass: string;
};

function ContentCard({
  item,
  onOpenImage,
  onEdit,
  onDelete,
  onRefreshMetricas,
  imageHeightClass,
}: ContentCardProps) {
  const theme = channelCardTheme(item.canal);
  const meta = getChannelMeta(item.canal);

  return (
    <article
      style={theme.cardStyle}
      className={`group relative overflow-hidden rounded-[28px] border shadow-[0_18px_38px_rgba(67,18,28,0.10)] transition duration-300 hover:-translate-y-[3px] hover:shadow-[0_24px_54px_rgba(67,18,28,0.16)] ${theme.borderClass}`}
    >
      <div
        style={theme.accentStyle}
        className="absolute inset-y-0 left-0 w-[8px] opacity-95"
      />

      {item.imagemUrl ? (
        <button
          type="button"
          onClick={() => onOpenImage(item.imagemUrl, item.nomeProjeto)}
          className={`relative block w-full overflow-hidden text-left ${imageHeightClass}`}
        >
          <img
            src={item.imagemUrl}
            alt={item.nomeProjeto}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#2b1820]/45 via-[#2b1820]/8 to-transparent" />

          <div className="absolute left-4 top-4 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold shadow-sm ${theme.channelBadgeClass}`}>
              <img
                src={meta.iconSrc}
                alt={meta.shortName}
                className="h-[13px] w-[13px] object-contain"
              />
              {canalLabel(String(item.canal || ""))}
            </span>
          </div>
        </button>
      ) : (
        <div
          className={`relative flex w-full items-center justify-center text-sm font-medium ${imageHeightClass} ${theme.imageFallbackClass}`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          Sem imagem
        </div>
      )}

      <div
        style={theme.ribbonStyle}
        className={`relative z-[1] flex items-center justify-between gap-3 border-y px-4 py-3 ${
          item.canal === "site" ? "border-[#ece2e5]" : "border-white/15"
        } ${theme.sideGlowClass}`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-white border-white/80">
            <img
              src={meta.iconSrc}
              alt={meta.shortName}
              className="h-[17px] w-[17px] object-contain"
            />
          </span>

          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.16em] opacity-75">
              Canal
            </div>
            <div className="truncate text-[17px] font-extrabold leading-tight">
              {meta.shortName}
            </div>
          </div>
        </div>

        <div
          className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-extrabold shadow-sm ${
            item.canal === "site"
              ? theme.typePillClass
              : "bg-white text-[#8f2431] border-white/70"
          }`}
        >
          {tipoLabel(String(item.canal || ""), String(item.tipo || ""))}
        </div>
      </div>

      <div className={`relative p-4 ${theme.contentClass}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-extrabold shadow-sm ${theme.channelPillClass}`}
              >
                <img
                  src={meta.iconSrc}
                  alt={meta.shortName}
                  className="h-[13px] w-[13px] object-contain"
                />
                {canalLabel(String(item.canal || ""))}
              </span>

              <span
                className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-extrabold shadow-sm ${theme.typePillClass}`}
              >
                {tipoLabel(String(item.canal || ""), String(item.tipo || ""))}
              </span>

              {item.segmento ? (
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-extrabold shadow-sm ${theme.segmentPillClass}`}
                >
                  {item.segmento}
                </span>
              ) : null}
            </div>

            <h3 className={`text-[21px] font-extrabold leading-tight ${theme.titleClass}`}>
              {item.nomeProjeto}
            </h3>

            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${metricasStatusClass(
                  item.metricasStatus,
                )}`}
              >
                {formatMetricasStatus(item.metricasStatus)}
              </span>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-[10px] uppercase tracking-[0.16em] text-[#aa8b93]">
              Views
            </div>
            <div className="mt-1 min-w-[66px] rounded-2xl border border-[#f0c4ca] bg-gradient-to-b from-[#fff2f4] to-[#ffe8eb] px-3 py-2 text-base font-extrabold text-[#a31320]">
              {formatViews(item.visualizacoes)}
            </div>
          </div>
        </div>

        <div className={`mt-4 rounded-2xl border px-3 py-3 ${theme.innerSurfaceClass}`}>
          <div className="text-[11px] uppercase tracking-[0.14em] text-[#aa8b93]">
            Cliente
          </div>
          <div className="mt-1 text-sm font-medium text-[#3d2a32]">
            {item.cliente || "Não informado"}
          </div>
        </div>

        {item.descricao ? (
          <p className="mt-4 text-sm leading-7 text-white/90 line-clamp-3">
            {item.descricao}
          </p>
        ) : (
          <p className="mt-4 text-sm italic text-[#9c8e96]">
            Sem descrição cadastrada.
          </p>
        )}

        <div className={`mt-4 rounded-2xl border px-3 py-3 text-xs text-[#8f7d86] truncate ${theme.innerSurfaceClass}`}>
          {item.link}
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <a
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-gradient-to-b from-[#e11d2e] to-[#c40f1d] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(213,22,32,0.16)] transition hover:-translate-y-[1px]"
            href={item.link}
            target="_blank"
            rel="noreferrer"
          >
            Abrir Link
          </a>

          {item.canal === "site" && (
            <button
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-[#d51620]/30 bg-[#fff0f2] px-4 py-2.5 text-sm font-semibold text-[#a31320] transition hover:bg-[#ffe4e8]"
              onClick={() => onRefreshMetricas(item)}
            >
              Atualizar métricas
            </button>
          )}

          <button
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-[#eadfe2] bg-white px-4 py-2.5 text-sm font-medium text-[#46363e] transition hover:bg-[#fff7f8]"
            onClick={() => onEdit(item)}
          >
            Editar
          </button>

          <button
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-[#f0c1c8] bg-[#fff3f5] px-4 py-2.5 text-sm font-medium text-[#b2212f] transition hover:bg-[#ffe8ec]"
            onClick={() => onDelete(item)}
          >
            Excluir
          </button>
        </div>
      </div>
    </article>
  );
}

export function AllContentsPage() {
  const [q, setQ] = useState("");
  const [canal, setCanal] = useState<string>("");
  const [tipo, setTipo] = useState<string>("");
  const [segmento, setSegmento] = useState<string>("");

  const [rawItems, setRawItems] = useState<ConteudoComMetricas[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<ConteudoComMetricas | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshingMetricas, setRefreshingMetricas] = useState(false);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>("");

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

  const tiposDisponiveis = useMemo(() => tiposPorCanal(canal), [canal]);

  useEffect(() => {
    if (!tipo) return;
    const allowed = tiposDisponiveis.map((t) => t.value);
    if (!allowed.includes(tipo)) {
      setTipo("");
    }
  }, [tipo, tiposDisponiveis]);

  const segmentosDisponiveis = useMemo(() => {
    const s = new Set<string>();
    for (const it of rawItems) {
      const seg = (it.segmento || "").trim();
      if (seg) s.add(seg);
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [rawItems]);

  const items = useMemo(() => {
    if (!segmento) return rawItems;
    return rawItems.filter((it) => (it.segmento || "").trim() === segmento);
  }, [rawItems, segmento]);

  function openCreate() {
    setModalMode("create");
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(item: ConteudoComMetricas) {
    setModalMode("edit");
    setEditing(item);
    setModalOpen(true);
  }

  function openImage(src?: string | null, title?: string) {
    if (!src) return;
    setPreviewImage(src);
    setPreviewTitle(title || "Imagem");
  }

  function closeImage() {
    setPreviewImage(null);
    setPreviewTitle("");
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

  async function handleRefreshMetricas() {
    if (!editing) return;

    try {
      setRefreshingMetricas(true);
      const refreshed = await contentStore.updateMetricas(editing.id);
      setEditing(refreshed);
      await fetchData();
    } catch (e: any) {
      alert(`Erro ao atualizar métricas: ${String(e?.message || e)}`);
    } finally {
      setRefreshingMetricas(false);
    }
  }

  async function handleRefreshMetricasFromCard(item: ConteudoComMetricas) {
    try {
      const refreshed = await contentStore.updateMetricas(item.id);

      setRawItems((prev) =>
        prev.map((current) =>
          current.id === item.id ? refreshed : current
        )
      );

      if (editing?.id === item.id) {
        setEditing(refreshed);
      }
    } catch (e: any) {
      alert(`Erro ao atualizar métricas: ${String(e?.message || e)}`);
    }
  }

  async function handleDelete(item: ConteudoComMetricas) {
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
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[22px] border border-[#eadfe2] bg-white/80 backdrop-blur-md shadow-[0_18px_45px_rgba(67,18,28,0.06)]">
        <div className="border-b border-[#f0e3e6] bg-gradient-to-r from-[#fff3f5] via-[#fff9fa] to-white px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-[#f3c8cd] bg-[#fff0f2] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a31320]">
                  Biblioteca Comercial
                </span>

                <span className="inline-flex items-center rounded-full border border-[#e9dde0] bg-white px-3 py-1 text-xs font-medium text-[#6f6370]">
                  Visão geral
                </span>
              </div>

              <h1 className="text-[20px] font-extrabold leading-tight text-[#2b1820] sm:text-[22px]">
                Todos os Conteúdos
              </h1>

              <p className="mt-1 max-w-3xl text-xs text-[#786b74]">
                Biblioteca central com filtros globais por canal, tipo e segmento.
              </p>
            </div>

            <div className="flex items-start xl:justify-end">
              <button
                className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-b from-[#e11d2e] to-[#c40f1d] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(213,22,32,0.18)] transition hover:-translate-y-[1px] sm:w-auto"
                onClick={openCreate}
                disabled={saving}
              >
                Novo Projeto
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white/70 px-4 py-4 sm:px-5">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
            <input
              className="w-full rounded-2xl border border-[#e7d9dd] bg-white px-4 py-3 text-[15px] text-[#2b1820] outline-none transition placeholder:text-[#a08f98] focus:border-[#d51620]/40 focus:ring-4 focus:ring-[#d51620]/10 xl:col-span-1"
              placeholder="Buscar em tudo (nome, cliente, segmento, descrição...)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />

            <select
              className="w-full rounded-2xl border border-[#e7d9dd] bg-[#fffafb] px-4 py-3 text-[15px] text-[#2b1820] outline-none transition focus:border-[#d51620]/40 focus:ring-4 focus:ring-[#d51620]/10"
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
              className="w-full rounded-2xl border border-[#e7d9dd] bg-[#fffafb] px-4 py-3 text-[15px] text-[#2b1820] outline-none transition focus:border-[#d51620]/40 focus:ring-4 focus:ring-[#d51620]/10"
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

            <select
              className="w-full rounded-2xl border border-[#e7d9dd] bg-[#fffafb] px-4 py-3 text-[15px] text-[#2b1820] outline-none transition focus:border-[#d51620]/40 focus:ring-4 focus:ring-[#d51620]/10 disabled:bg-[#f1eef0] disabled:text-[#8d7d86]"
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

          <div className="mt-3 flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              className="inline-flex items-center justify-center rounded-xl border border-[#eadfe2] bg-white px-3 py-2 text-sm font-medium text-[#4f4048] transition hover:bg-[#fff6f7] disabled:opacity-60"
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

            <button
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-[#e11d2e] to-[#c40f1d] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(213,22,32,0.18)] transition hover:-translate-y-[1px] disabled:opacity-60"
              onClick={fetchData}
              disabled={loading}
            >
              Atualizar
            </button>

            <div className="self-center text-xs text-[#8b7d86] sm:ml-auto">
              {loading ? "Carregando..." : err ? `Erro: ${err}` : `${items.length} item(ns)`}
            </div>
          </div>
        </div>
      </section>

      {err ? (
        <div className="rounded-2xl border border-[#f0bcc3] bg-[#fff1f3] px-4 py-4 text-sm text-[#ba2533] shadow-sm">
          Erro ao buscar conteúdos: {err}
        </div>
      ) : null}

      {!loading && !err ? (
        <>
          <div className="hidden lg:grid gap-5 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {items.map((it) => (
              <ContentCard
                key={it.id}
                item={it}
                onOpenImage={openImage}
                onEdit={openEdit}
                onDelete={handleDelete}
                onRefreshMetricas={handleRefreshMetricasFromCard}
                imageHeightClass="h-[200px]"
              />
            ))}

            {items.length === 0 ? (
              <div className="col-span-full rounded-[24px] border border-dashed border-[#e7d5d9] bg-white/65 px-6 py-10 text-center text-[#7f727b]">
                Nenhum conteúdo encontrado com esses filtros.
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-5 lg:hidden">
            {items.map((it) => (
              <ContentCard
                key={it.id}
                item={it}
                onOpenImage={openImage}
                onEdit={openEdit}
                onDelete={handleDelete}
                onRefreshMetricas={handleRefreshMetricasFromCard}
                imageHeightClass="h-[190px]"
              />
            ))}

            {items.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[#e7d5d9] bg-white/65 px-6 py-10 text-center text-[#7f727b]">
                Nenhum conteúdo encontrado com esses filtros.
              </div>
            ) : null}
          </div>
        </>
      ) : null}

      {previewImage ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4"
          onClick={closeImage}
        >
          <div
            className="relative w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold text-[#2b1820] shadow-md transition hover:scale-105"
              onClick={closeImage}
              aria-label="Fechar imagem"
            >
              ✕
            </button>

            <img
              src={previewImage}
              alt={previewTitle || "Prévia ampliada"}
              className="max-h-[85vh] w-full rounded-2xl bg-white object-contain"
            />
          </div>
        </div>
      ) : null}

      <NewProjectModal
        open={modalOpen}
        mode={modalMode}
        saving={saving}
        refreshingMetricas={refreshingMetricas}
        metricasStatus={editing?.metricasStatus as any}
        metricasOrigem={editing?.metricasOrigem as any}
        viewsAtualizadasEm={editing?.viewsAtualizadasEm ?? null}
        metricasErro={editing?.metricasErro ?? null}
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
                imagemUrl: editing.imagemUrl ?? "",
              }
            : null
        }
        onClose={() => {
          if (saving || refreshingMetricas) return;
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        onRefreshMetricas={modalMode === "edit" ? handleRefreshMetricas : undefined}
        onAutoPreviewMetricas={contentStore.previewMetricas}
      />
    </div>
  );
}