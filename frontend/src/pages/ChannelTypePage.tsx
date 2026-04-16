import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { contentStore, type ConteudoComMetricas } from "../storage/contentStore";
import { canalLabel, tipoLabel } from "../domain/contentTypes";
import { NewProjectModal } from "../components/NewProjectModal";

type FormValue = Omit<
  ConteudoComMetricas,
  "id" | "createdAt" | "metricasStatus" | "metricasOrigem" | "viewsAtualizadasEm" | "metricasErro"
>;

function compactUrl(url: string) {
  try {
    const u = new URL(url);
    const path = u.pathname.length > 34 ? u.pathname.slice(0, 34) + "…" : u.pathname;
    return `${u.host}${path}${u.search ? "?" : ""}`;
  } catch {
    return url.replace(/^https?:\/\//, "").slice(0, 48);
  }
}

function formatDateBR(value?: string | null) {
  const v = (value || "").trim();
  if (!v) return "";
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;

  const d = new Date(v);
  if (!Number.isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  return v;
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

export function ChannelTypePage() {
  const { canal, tipo } = useParams();

  const [q, setQ] = useState("");
  const [segmento, setSegmento] = useState<string>("");
  const [cliente, setCliente] = useState<string>("");

  const [items, setItems] = useState<ConteudoComMetricas[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ConteudoComMetricas | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshingMetricas, setRefreshingMetricas] = useState(false);
  const [refreshingCardId, setRefreshingCardId] = useState<string | null>(null);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>("");

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

  function openEdit(item: ConteudoComMetricas) {
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
    if (!editing) return;

    try {
      setSaving(true);
      await contentStore.update(editing.id, payload);
      const refreshed = await contentStore.getById(editing.id);
      setEditing(refreshed);
      await fetchData();
      setModalOpen(false);
      setEditing(null);
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
    setRefreshingCardId(item.id);

    const refreshed = await contentStore.updateMetricas(item.id);

    setItems((prev) =>
      prev.map((current) =>
        current.id === item.id ? refreshed : current
      )
    );

    if (editing?.id === item.id) {
      setEditing(refreshed);
    }
  } catch (e: any) {
    alert(`Erro ao atualizar métricas: ${String(e?.message || e)}`);
  } finally {
    setRefreshingCardId(null);
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
      <section className="rounded-[22px] border border-[#eadfe2] bg-white/80 backdrop-blur-md shadow-[0_18px_45px_rgba(67,18,28,0.06)] overflow-hidden">
        <div className="bg-gradient-to-r from-[#fff5f6] via-[#fffafb] to-white px-4 sm:px-5 py-4 border-b border-[#f0e3e6]">
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center rounded-full border border-[#f3c8cd] bg-[#fff0f2] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a31320]">
                  Biblioteca Comercial
                </span>

                <span className="inline-flex items-center rounded-full border border-[#e9dde0] bg-white px-3 py-1 text-xs font-medium text-[#6f6370]">
                  {canalLabel(canal || "")}
                </span>
              </div>

              <h1 className="text-[20px] sm:text-[22px] leading-tight font-extrabold text-[#2b1820]">
                {tipoLabel(canal || "", tipo || "")}
              </h1>

              <p className="mt-1 text-xs text-[#786b74] max-w-3xl">
                Repositório de referências para apoiar o time comercial com exemplos,
                argumentos de venda e cases por formato.
              </p>
            </div>

            <div className="w-full xl:w-[420px]">
              <input
                className="w-full rounded-2xl border border-[#e7d9dd] bg-white px-4 py-3 text-[15px] text-[#2b1820] outline-none transition placeholder:text-[#a08f98] focus:border-[#d51620]/40 focus:ring-4 focus:ring-[#d51620]/10"
                placeholder="Buscar por nome, cliente, segmento, descrição..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-5 py-4 bg-white/70">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select
              className="w-full rounded-2xl border border-[#e7d9dd] bg-[#fffafb] px-4 py-3 text-[15px] text-[#2b1820] outline-none transition focus:border-[#d51620]/40 focus:ring-4 focus:ring-[#d51620]/10"
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
              className="w-full rounded-2xl border border-[#e7d9dd] bg-[#fffafb] px-4 py-3 text-[15px] text-[#2b1820] outline-none transition focus:border-[#d51620]/40 focus:ring-4 focus:ring-[#d51620]/10"
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

          <div className="mt-3 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
            <button
              className="inline-flex items-center justify-center rounded-xl border border-[#eadfe2] bg-white px-3 py-2 text-sm font-medium text-[#4f4048] transition hover:bg-[#fff6f7]"
              onClick={() => {
                setQ("");
                setSegmento("");
                setCliente("");
              }}
              disabled={loading}
            >
              Limpar filtros
            </button>

            <button
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-[#e11d2e] to-[#c40f1d] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(213,22,32,0.18)] transition hover:-translate-y-[1px]"
              onClick={fetchData}
              disabled={loading}
            >
              Atualizar
            </button>

            <div className="sm:ml-auto text-xs text-[#8b7d86] self-center">
              {loading ? "Carregando..." : `${filteredItems.length} item(ns)`}
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
          <div className="hidden lg:grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
            {filteredItems.map((it) => {
              const dataBR = formatDateBR(it.dataPublicacao);
              const canRefreshMetricas =
                it.canal === "site" && it.tipo === "conteudo-de-marca";

              return (
                <article
                  key={it.id}
                  className="group overflow-hidden rounded-[24px] border border-[#eadfe2] bg-white/80 shadow-[0_12px_30px_rgba(67,18,28,0.05)] transition hover:-translate-y-[2px] hover:border-[#e7b8bf] hover:shadow-[0_18px_36px_rgba(120,20,34,0.10)]"
                >
                  {it.imagemUrl ? (
                    <button
                      type="button"
                      onClick={() => openImage(it.imagemUrl, it.nomeProjeto)}
                      className="relative block h-[190px] w-full overflow-hidden bg-[#f7f2f4] text-left"
                    >
                      <img
                        src={it.imagemUrl}
                        alt={it.nomeProjeto}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#2b1820]/35 to-transparent" />
                    </button>
                  ) : (
                    <div className="flex h-[190px] w-full items-center justify-center bg-gradient-to-br from-[#fff3f5] via-[#fffafb] to-white text-sm font-medium text-[#b39aa3]">
                      Sem imagem
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-lg font-extrabold text-[#2b1820] leading-tight">
                          {it.nomeProjeto}
                        </h3>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="inline-flex items-center rounded-full border border-[#f0d5d9] bg-[#fff7f8] px-2.5 py-1 text-[11px] font-semibold text-[#9d1b28]">
                            {tipoLabel(String(it.canal || ""), String(it.tipo || ""))}
                          </span>

                          {it.segmento ? (
                            <span className="inline-flex items-center rounded-full border border-[#ece4e7] bg-white px-2.5 py-1 text-[11px] text-[#6f6370]">
                              {it.segmento}
                            </span>
                          ) : null}

                          {dataBR ? (
                            <span className="inline-flex items-center rounded-full border border-[#ece4e7] bg-white px-2.5 py-1 text-[11px] text-[#6f6370]">
                              {dataBR}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#aa8b93]">
                          Views
                        </div>
                        <div className="mt-1 rounded-2xl border border-[#f0c4ca] bg-gradient-to-b from-[#fff2f4] to-[#ffe8eb] px-3 py-1.5 text-sm font-extrabold text-[#a31320]">
                          {formatViews(it.visualizacoes)}
                        </div>
                        <div className="mt-1">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${metricasStatusClass(
                              it.metricasStatus,
                            )}`}
                          >
                            {formatMetricasStatus(it.metricasStatus)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-[#f1e5e8] bg-[#fffafb] px-3 py-3">
                      <div className="text-[11px] uppercase tracking-[0.14em] text-[#aa8b93]">
                        Cliente
                      </div>
                      <div className="mt-1 text-sm font-medium text-[#3d2a32]">
                        {it.cliente || "Não informado"}
                      </div>
                    </div>

                    {it.descricao ? (
                      <p className="mt-4 text-sm leading-6 text-[#5f525a] line-clamp-3">
                        {it.descricao}
                      </p>
                    ) : (
                      <p className="mt-4 text-sm italic text-[#9a8e98]">
                        Sem descrição cadastrada.
                      </p>
                    )}

                    <div className="mt-4 rounded-xl bg-[#fbf6f7] px-3 py-2 text-[12px] text-[#8d7d86] truncate border border-[#f1e6e9]">
                      {it.link ? compactUrl(it.link) : ""}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <a
                        className="inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-[#e11d2e] to-[#c40f1d] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(213,22,32,0.16)] transition hover:-translate-y-[1px]"
                        href={it.link}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Abrir Link
                      </a>

                      {canRefreshMetricas ? (
                        <button
                          className="inline-flex items-center justify-center rounded-xl border border-[#d51620]/30 bg-[#fff0f2] px-4 py-2 text-sm font-semibold text-[#a31320] transition hover:bg-[#ffe4e8] disabled:opacity-60"
                          onClick={() => handleRefreshMetricasFromCard(it)}
                          disabled={refreshingCardId === it.id}
                        >
                          {refreshingCardId === it.id
                            ? "Atualizando..."
                            : "Atualizar métricas"}
                        </button>
                      ) : null}

                      <button
                        className="inline-flex items-center justify-center rounded-xl border border-[#eadfe2] bg-white px-4 py-2 text-sm font-medium text-[#46363e] transition hover:bg-[#fff7f8]"
                        onClick={() => openEdit(it)}
                      >
                        Editar
                      </button>

                      <button
                        className="sm:ml-auto inline-flex items-center justify-center rounded-xl border border-[#f0c1c8] bg-[#fff3f5] px-4 py-2 text-sm font-medium text-[#b2212f] transition hover:bg-[#ffe8ec]"
                        onClick={() => handleDelete(it)}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}

            {filteredItems.length === 0 ? (
              <div className="col-span-full rounded-[24px] border border-dashed border-[#e7d5d9] bg-white/65 px-6 py-10 text-center text-[#7f727b]">
                Nenhum conteúdo encontrado com os filtros selecionados.
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {filteredItems.map((it) => {
              const dataBR = formatDateBR(it.dataPublicacao);
              const canRefreshMetricas =
                it.canal === "site" && it.tipo === "conteudo-de-marca";

              return (
                <article
                  key={it.id}
                  className="group overflow-hidden rounded-[22px] border border-[#eadfe2] bg-white/85 shadow-[0_12px_30px_rgba(67,18,28,0.05)]"
                >
                  {it.imagemUrl ? (
                    <button
                      type="button"
                      onClick={() => openImage(it.imagemUrl, it.nomeProjeto)}
                      className="relative block h-[190px] w-full overflow-hidden bg-[#f7f2f4] text-left"
                    >
                      <img
                        src={it.imagemUrl}
                        alt={it.nomeProjeto}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#2b1820]/35 to-transparent" />
                    </button>
                  ) : (
                    <div className="flex h-[190px] w-full items-center justify-center bg-gradient-to-br from-[#fff3f5] via-[#fffafb] to-white text-sm font-medium text-[#b39aa3]">
                      Sem imagem
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-base font-extrabold text-[#2b1820] leading-tight">
                          {it.nomeProjeto}
                        </h3>
                        <p className="mt-1 text-xs text-[#8d7d86]">
                          {it.segmento || "Sem segmento"}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[10px] uppercase tracking-[0.12em] text-[#aa8b93]">
                          Views
                        </div>
                        <div className="mt-1 rounded-xl border border-[#f0c4ca] bg-gradient-to-b from-[#fff2f4] to-[#ffe8eb] px-3 py-1.5 text-sm font-extrabold text-[#a31320]">
                          {formatViews(it.visualizacoes)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full border border-[#ece4e7] bg-white px-2.5 py-1 text-[11px] text-[#6f6370]">
                        {canalLabel(String(it.canal || ""))}
                      </span>

                      <span className="inline-flex items-center rounded-full border border-[#f0d5d9] bg-[#fff7f8] px-2.5 py-1 text-[11px] font-semibold text-[#9d1b28]">
                        {tipoLabel(String(it.canal || ""), String(it.tipo || ""))}
                      </span>

                      {dataBR ? (
                        <span className="inline-flex items-center rounded-full border border-[#ece4e7] bg-white px-2.5 py-1 text-[11px] text-[#6f6370]">
                          {dataBR}
                        </span>
                      ) : null}

                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${metricasStatusClass(
                          it.metricasStatus,
                        )}`}
                      >
                        {formatMetricasStatus(it.metricasStatus)}
                      </span>
                    </div>

                    <div className="mt-4 rounded-2xl border border-[#f1e5e8] bg-[#fffafb] px-3 py-3">
                      <div className="text-[11px] uppercase tracking-[0.14em] text-[#aa8b93]">
                        Cliente
                      </div>
                      <div className="mt-1 text-sm font-medium text-[#3d2a32]">
                        {it.cliente || "Não informado"}
                      </div>
                    </div>

                    {it.descricao ? (
                      <p className="mt-4 text-sm leading-6 text-[#5f525a] line-clamp-3">
                        {it.descricao}
                      </p>
                    ) : (
                      <p className="mt-4 text-sm italic text-[#9c8e96]">
                        Sem descrição cadastrada.
                      </p>
                    )}

                    <div className="mt-4 rounded-xl bg-[#fbf6f7] px-3 py-2 text-[12px] text-[#8d7d86] truncate border border-[#f1e6e9]">
                      {it.link ? compactUrl(it.link) : ""}
                    </div>

                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                      <a
                        className="inline-flex flex-1 items-center justify-center rounded-xl bg-gradient-to-b from-[#e11d2e] to-[#c40f1d] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(213,22,32,0.16)] transition hover:-translate-y-[1px]"
                        href={it.link}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Abrir Link
                      </a>

                      {canRefreshMetricas ? (
                        <button
                          className="inline-flex flex-1 items-center justify-center rounded-xl border border-[#d51620]/30 bg-[#fff0f2] px-4 py-2.5 text-sm font-semibold text-[#a31320] transition hover:bg-[#ffe4e8] disabled:opacity-60"
                          onClick={() => handleRefreshMetricasFromCard(it)}
                          disabled={refreshingCardId === it.id}
                        >
                          {refreshingCardId === it.id
                            ? "Atualizando..."
                            : "Atualizar métricas"}
                        </button>
                      ) : null}

                      <button
                        className="inline-flex flex-1 items-center justify-center rounded-xl border border-[#eadfe2] bg-white px-4 py-2.5 text-sm font-medium text-[#46363e] transition hover:bg-[#fff7f8]"
                        onClick={() => openEdit(it)}
                      >
                        Editar
                      </button>

                      <button
                        className="inline-flex flex-1 items-center justify-center rounded-xl border border-[#f0c1c8] bg-[#fff3f5] px-4 py-2.5 text-sm font-medium text-[#b2212f] transition hover:bg-[#ffe8ec]"
                        onClick={() => handleDelete(it)}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}

            {filteredItems.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[#e7d5d9] bg-white/65 px-6 py-10 text-center text-[#7f727b]">
                Nenhum conteúdo encontrado com os filtros selecionados.
              </div>
            ) : null}
          </div>
        </>
      ) : null}

      {previewImage ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4"
          onClick={closeImage}
        >
          <div
            className="relative w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-base font-bold text-[#2b1820] shadow-md transition hover:bg-white"
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
        mode="edit"
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
        onRefreshMetricas={handleRefreshMetricas}
        onAutoPreviewMetricas={contentStore.previewMetricas}
      />
    </div>
  );
}