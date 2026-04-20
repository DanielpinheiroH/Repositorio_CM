import { useEffect, useMemo, useRef, useState } from "react";
import type { ProjetoConteudo } from "../domain/models";
import { apiUploadImagem } from "../services/api";

type Mode = "create" | "edit";
type FormValue = Omit<ProjetoConteudo, "id" | "createdAt">;

type Props = {
  open: boolean;
  mode?: Mode;
  initialValue?: Partial<FormValue> | null;
  onClose: () => void;
  onSave: (payload: FormValue) => void | Promise<void>;
  saving?: boolean;

  metricasStatus?: "pendente" | "sucesso" | "erro" | "manual" | null;
  metricasOrigem?: "manual" | "ga4" | null;
  viewsAtualizadasEm?: string | null;
  metricasErro?: string | null;

  onRefreshMetricas?: (payload: FormValue) => void | Promise<void>;
  onAutoPreviewMetricas?: (url: string) => Promise<{
    visualizacoes: number;
    metricasStatus: string;
    metricasOrigem: string;
    viewsAtualizadasEm: string;
    metricasErro?: string | null;
  }>;
  refreshingMetricas?: boolean;
};

const CANAIS = [
  { value: "site", label: "Site/Portal" },
  { value: "youtube", label: "YouTube" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "kwai", label: "Kwai" },
  { value: "facebook", label: "Facebook" },
];

function tiposPorCanal(canal: string) {
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

const emptyForm: FormValue = {
  nomeProjeto: "",
  canal: "site" as any,
  tipo: "conteudo-de-marca" as any,
  visualizacoes: null,
  segmento: "",
  dataPublicacao: "",
  cliente: "",
  link: "",
  descricao: "",
  imagemUrl: "",
};

function formatDateTimeBR(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

function metricasBadge(status?: string | null) {
  switch (status) {
    case "sucesso":
      return {
        label: "Atualizado",
        className: "border border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    case "erro":
      return {
        label: "Erro",
        className: "border border-rose-200 bg-rose-50 text-rose-700",
      };
    case "manual":
      return {
        label: "Manual",
        className: "border border-amber-200 bg-amber-50 text-amber-700",
      };
    default:
      return {
        label: "Pendente",
        className: "border border-zinc-200 bg-zinc-50 text-zinc-600",
      };
  }
}

export function NewProjectModal({
  open,
  mode = "create",
  initialValue,
  onClose,
  onSave,
  saving = false,

  metricasStatus = null,
  metricasOrigem = null,
  viewsAtualizadasEm = null,
  metricasErro = null,

  onRefreshMetricas,
  onAutoPreviewMetricas,
  refreshingMetricas = false,
}: Props) {
  const [form, setForm] = useState<FormValue>(emptyForm);

  const [autoMetricasStatus, setAutoMetricasStatus] = useState<string | null>(metricasStatus);
  const [autoMetricasOrigem, setAutoMetricasOrigem] = useState<string | null>(metricasOrigem);
  const [autoViewsAtualizadasEm, setAutoViewsAtualizadasEm] = useState<string | null>(viewsAtualizadasEm);
  const [autoMetricasErro, setAutoMetricasErro] = useState<string | null>(metricasErro);
  const [autoRefreshing, setAutoRefreshing] = useState(false);
  const [uploadingImagem, setUploadingImagem] = useState(false);

  const debounceRef = useRef<number | null>(null);
  const lastPreviewUrlRef = useRef<string>("");

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && initialValue) {
      const merged: FormValue = {
        ...emptyForm,
        ...initialValue,
        segmento: initialValue.segmento ?? "",
        cliente: initialValue.cliente ?? "",
        dataPublicacao: initialValue.dataPublicacao ?? "",
        descricao: initialValue.descricao ?? "",
        link: initialValue.link ?? "",
        imagemUrl: initialValue.imagemUrl ?? "",
        nomeProjeto: initialValue.nomeProjeto ?? "",
        visualizacoes: initialValue.visualizacoes ?? null,
        canal: (initialValue.canal ?? "site") as any,
        tipo: (initialValue.tipo ?? "conteudo-de-marca") as any,
      };
      setForm(merged);
    } else {
      setForm(emptyForm);
    }

    setAutoMetricasStatus(metricasStatus ?? null);
    setAutoMetricasOrigem(metricasOrigem ?? null);
    setAutoViewsAtualizadasEm(viewsAtualizadasEm ?? null);
    setAutoMetricasErro(metricasErro ?? null);
    lastPreviewUrlRef.current = initialValue?.link?.trim?.() || "";
  }, [open, mode, initialValue, metricasStatus, metricasOrigem, viewsAtualizadasEm, metricasErro]);

  const tipos = useMemo(() => tiposPorCanal(String(form.canal || "site")), [form.canal]);

  useEffect(() => {
    if (!open) return;
    const allowed = tipos.map((t) => t.value);
    if (!allowed.includes(String(form.tipo))) {
      setForm((prev) => ({ ...prev, tipo: allowed[0] as any }));
    }
  }, [open, tipos, form.tipo]);

  useEffect(() => {
    if (!open || !onAutoPreviewMetricas) return;

    const cleanUrl = form.link.trim();

    if (!cleanUrl || cleanUrl === lastPreviewUrlRef.current) return;

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(async () => {
      try {
        setAutoRefreshing(true);
        const preview = await onAutoPreviewMetricas(cleanUrl);

        setForm((prev) => ({
          ...prev,
          visualizacoes: preview.visualizacoes,
        }));

        setAutoMetricasStatus(preview.metricasStatus);
        setAutoMetricasOrigem(preview.metricasOrigem);
        setAutoViewsAtualizadasEm(preview.viewsAtualizadasEm);
        setAutoMetricasErro(preview.metricasErro ?? null);
        lastPreviewUrlRef.current = cleanUrl;
      } catch (e: any) {
        setAutoMetricasStatus("erro");
        setAutoMetricasOrigem("ga4");
        setAutoViewsAtualizadasEm(new Date().toISOString());
        setAutoMetricasErro(String(e?.message || e));
      } finally {
        setAutoRefreshing(false);
      }
    }, 900);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [form.link, open, onAutoPreviewMetricas]);

  async function handleUploadImagem(file: File) {
    try {
      setUploadingImagem(true);
      const uploaded = await apiUploadImagem(file);

      setForm((prev) => ({
        ...prev,
        imagemUrl: uploaded.url,
      }));
    } catch (e: any) {
      alert(`Erro ao subir imagem: ${String(e?.message || e)}`);
    } finally {
      setUploadingImagem(false);
    }
  }

  if (!open) return null;

  const title = mode === "edit" ? "Editar Projeto" : "Novo Projeto";
  const subtitle =
    mode === "edit"
      ? "Atualize os dados do conteúdo, sincronize métricas e salve as alterações."
      : "Cadastre um novo conteúdo e, ao informar o link, as views podem ser preenchidas automaticamente.";
  const primaryLabel = mode === "edit" ? "Salvar alterações" : "Salvar projeto";

  const badge = metricasBadge(autoMetricasStatus);

  function set<K extends keyof FormValue>(key: K, value: FormValue[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleRefreshMetricas() {
    if (!onRefreshMetricas) return;

    if (!form.link.trim()) {
      alert("Informe o link antes de atualizar métricas.");
      return;
    }

    await onRefreshMetricas({
      ...form,
      nomeProjeto: form.nomeProjeto.trim(),
      link: form.link.trim(),
      imagemUrl: form.imagemUrl?.trim() ? form.imagemUrl.trim() : null,
      segmento: form.segmento?.trim() || "",
      cliente: form.cliente?.trim() || "",
      descricao: form.descricao?.trim() || "",
      dataPublicacao: form.dataPublicacao?.trim() ? form.dataPublicacao : null,
      visualizacoes:
        form.visualizacoes === null ||
        form.visualizacoes === undefined ||
        Number.isNaN(Number(form.visualizacoes))
          ? null
          : Number(form.visualizacoes),
    });
  }

  function submit() {
  if (uploadingImagem) {
    alert("Aguarde o upload da imagem terminar.");
    return;
  }

  if (!form.nomeProjeto.trim()) {
    alert("Informe o Nome do Projeto.");
    return;
  }
  if (!String(form.canal || "").trim()) {
    alert("Selecione o Canal/Página.");
    return;
  }
  if (!String(form.tipo || "").trim()) {
    alert("Selecione o Tipo.");
    return;
  }
  if (!form.link.trim()) {
    alert("Informe o Link.");
    return;
  }

  onSave({
    ...form,
    nomeProjeto: form.nomeProjeto.trim(),
    link: form.link.trim(),
    imagemUrl: form.imagemUrl?.trim() ? form.imagemUrl.trim() : null,
    segmento: form.segmento?.trim() || "",
    cliente: form.cliente?.trim() || "",
    descricao: form.descricao?.trim() || "",
    dataPublicacao: form.dataPublicacao?.trim() ? form.dataPublicacao : null,
    visualizacoes:
      form.visualizacoes === null ||
      form.visualizacoes === undefined ||
      Number.isNaN(Number(form.visualizacoes))
        ? null
        : Number(form.visualizacoes),
  });
}

  const inputClass =
    "mt-1 w-full rounded-2xl border border-[#e7d9dd] bg-white px-4 py-3 text-[15px] text-[#2b1820] outline-none transition placeholder:text-[#a08f98] focus:border-[#d51620]/40 focus:ring-4 focus:ring-[#d51620]/10";

  const labelClass =
    "text-[12px] font-semibold uppercase tracking-[0.08em] text-[#8f7d86]";

  const canRefreshMetricas =
    mode === "edit" && !!onRefreshMetricas && !!form.link.trim();

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-[#2a0a10]/45 backdrop-blur-[3px]"
        onClick={saving || refreshingMetricas || autoRefreshing || uploadingImagem ? undefined : onClose}
      />

      <div className="relative w-full sm:max-w-4xl sm:rounded-[28px] rounded-t-[28px] sm:rounded-b-[28px] border border-[#eadfe2] bg-[#fffdfd] shadow-[0_24px_80px_rgba(58,16,24,0.22)] overflow-hidden max-h-[92vh] flex flex-col">
        <div className="bg-gradient-to-r from-[#fff2f4] via-[#fff9fa] to-white px-4 sm:px-6 py-4 sm:py-5 border-b border-[#f0e3e6]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center rounded-full border border-[#f3c8cd] bg-[#fff0f2] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a31320]">
                  {mode === "edit" ? "Edição" : "Cadastro"}
                </span>

                <span className="inline-flex items-center rounded-full border border-[#e9dde0] bg-white px-3 py-1 text-xs font-medium text-[#6f6370]">
                  Conteúdo comercial
                </span>
              </div>

              <h2 className="text-[22px] sm:text-[26px] leading-tight font-extrabold text-[#2b1820]">
                {title}
              </h2>

              <p className="mt-1 text-sm text-[#786b74] max-w-2xl">
                {subtitle}
              </p>
            </div>

            <button
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#eadfe2] bg-white text-[#6f6370] transition hover:bg-[#fff6f7] disabled:opacity-60"
              onClick={onClose}
              disabled={saving || refreshingMetricas || autoRefreshing || uploadingImagem}
              aria-label="Fechar modal"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 bg-white">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 space-y-4">
              <section className="rounded-[24px] border border-[#ece2e5] bg-[#fffafb] p-4 sm:p-5">
                <div className="mb-4">
                  <div className="text-[13px] font-bold text-[#2b1820]">
                    Informações principais
                  </div>
                  <div className="text-xs text-[#8f7d86] mt-1">
                    Dados básicos do conteúdo para organização e uso comercial.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className={labelClass}>Nome do Projeto</label>
                    <input
                      className={inputClass}
                      value={form.nomeProjeto}
                      onChange={(e) => set("nomeProjeto", e.target.value)}
                      placeholder="Ex.: Conteúdo de marca — Campanha X"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Canal/Página</label>
                    <select
                      className={inputClass}
                      value={String(form.canal)}
                      onChange={(e) => set("canal", e.target.value as any)}
                    >
                      {CANAIS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Tipo</label>
                    <select
                      className={inputClass}
                      value={String(form.tipo)}
                      onChange={(e) => set("tipo", e.target.value as any)}
                    >
                      {tipos.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Cliente</label>
                    <input
                      className={inputClass}
                      value={form.cliente || ""}
                      onChange={(e) => set("cliente", e.target.value)}
                      placeholder="Ex.: Marca XYZ"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Segmento</label>
                    <input
                      className={inputClass}
                      value={form.segmento || ""}
                      onChange={(e) => set("segmento", e.target.value)}
                      placeholder="Ex.: Varejo, Educação, Saúde..."
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-[24px] border border-[#ece2e5] bg-[#fffafb] p-4 sm:p-5">
                <div className="mb-4">
                  <div className="text-[13px] font-bold text-[#2b1820]">
                    Link, imagem e descrição
                  </div>
                  <div className="text-xs text-[#8f7d86] mt-1">
                    Ao preencher o link, o sistema tenta buscar as views automaticamente.
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className={labelClass}>Link</label>
                    <input
                      className={inputClass}
                      value={form.link}
                      onChange={(e) => set("link", e.target.value)}
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className={labelClass}>URL da imagem</label>
                    <input
                      className={inputClass}
                      value={form.imagemUrl || ""}
                      onChange={(e) => set("imagemUrl", e.target.value)}
                      placeholder="https://images....jpg"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Ou enviar imagem</label>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="mt-1 w-full rounded-2xl border border-[#e7d9dd] bg-white px-4 py-3 text-sm text-[#2b1820] outline-none transition file:mr-3 file:rounded-xl file:border-0 file:bg-[#fff0f2] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#a31320] hover:file:bg-[#ffe5e8]"
                      onChange={async (e) => {
  const file = e.target.files?.[0];
  if (file) {
    await handleUploadImagem(file);
  }
}}
                      disabled={uploadingImagem || saving}
                    />
                    {uploadingImagem ? (
                      <div className="mt-2 text-xs text-[#a31320]">
                        Enviando imagem...
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-[#8f7d86]">
                        Aceita PNG, JPG, JPEG e WEBP.
                      </div>
                    )}
                  </div>

                  {form.imagemUrl?.trim() ? (
                    <div className="overflow-hidden rounded-2xl border border-[#eadfe2] bg-white">
                      <img
                        src={form.imagemUrl}
                        alt={form.nomeProjeto || "Prévia da imagem"}
                        className="h-[220px] w-full object-cover"
                      />
                    </div>
                  ) : null}

                  <div>
                    <label className={labelClass}>Descrição</label>
                    <textarea
                      className={`${inputClass} min-h-[140px] resize-y`}
                      value={form.descricao || ""}
                      onChange={(e) => set("descricao", e.target.value)}
                      placeholder="Contexto, objetivo comercial, diferencial do formato, observações..."
                    />
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-4">
              <section className="rounded-[24px] border border-[#ece2e5] bg-[#fffafb] p-4 sm:p-5">
                <div className="mb-4">
                  <div className="text-[13px] font-bold text-[#2b1820]">
                    Métricas e data
                  </div>
                  <div className="text-xs text-[#8f7d86] mt-1">
                    As visualizações podem ser preenchidas automaticamente pelo link.
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className={labelClass}>Visualizações</label>
                    <input
                      type="number"
                      className={inputClass}
                      value={form.visualizacoes ?? ""}
                      onChange={(e) =>
                        set(
                          "visualizacoes",
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                      placeholder={autoRefreshing ? "Buscando views..." : "Ex.: 120000"}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Data da publicação</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={form.dataPublicacao || ""}
                      onChange={(e) => set("dataPublicacao", e.target.value)}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-[24px] border border-[#f0d7db] bg-gradient-to-br from-[#fff5f6] to-[#fffdfd] p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[13px] font-bold text-[#2b1820]">
                      Status das métricas
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${badge.className}`}
                      >
                        {autoRefreshing ? "Buscando..." : badge.label}
                      </span>

                      {autoMetricasOrigem ? (
                        <span className="inline-flex items-center rounded-full border border-[#e9dde0] bg-white px-3 py-1 text-[11px] font-medium text-[#6f6370]">
                          Origem: {autoMetricasOrigem.toUpperCase()}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-xs leading-5 text-[#786b74]">
                  Última atualização:{" "}
                  <span className="font-medium text-[#5e4d55]">
                    {formatDateTimeBR(autoViewsAtualizadasEm)}
                  </span>
                </div>

                {autoMetricasErro ? (
                  <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-3 text-xs leading-5 text-rose-700">
                    {autoMetricasErro}
                  </div>
                ) : (
                  <div className="mt-3 text-xs leading-5 text-[#786b74]">
                    {mode === "create"
                      ? "No novo cadastro, as views podem aparecer automaticamente ao informar o link."
                      : "No modo edição, você pode atualizar manualmente também."}
                  </div>
                )}

                <div className="mt-4 grid gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-xl border border-[#eadfe2] bg-white px-4 py-2.5 text-sm font-medium text-[#6a5861] transition hover:bg-[#fff7f8] disabled:opacity-60"
                    onClick={handleRefreshMetricas}
                    disabled={!canRefreshMetricas || refreshingMetricas || saving || autoRefreshing || uploadingImagem}
                  >
                    {refreshingMetricas ? "Atualizando..." : "Atualizar métricas"}
                  </button>

                  {!canRefreshMetricas ? (
                    <div className="text-[11px] text-[#9b8c94]">
                      Disponível ao editar um conteúdo com link preenchido.
                    </div>
                  ) : null}
                </div>
              </section>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 border-t border-[#f0e3e6] bg-white/95">
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
            <button
              className="inline-flex items-center justify-center rounded-xl border border-[#eadfe2] bg-white px-4 py-3 text-sm font-medium text-[#4f4048] transition hover:bg-[#fff6f7] disabled:opacity-60"
              onClick={onClose}
              disabled={saving || refreshingMetricas || autoRefreshing || uploadingImagem}
            >
              Cancelar
            </button>

            <button
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-[#e11d2e] to-[#c40f1d] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(213,22,32,0.18)] transition hover:-translate-y-[1px] disabled:opacity-60"
              onClick={submit}
              disabled={saving || refreshingMetricas || autoRefreshing || uploadingImagem}
            >
              {saving ? "Salvando..." : primaryLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}