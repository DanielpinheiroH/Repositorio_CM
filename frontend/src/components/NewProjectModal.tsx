import { useEffect, useMemo, useState } from "react";
import type { ProjetoConteudo } from "../domain/models";

type Mode = "create" | "edit";

type FormValue = Omit<ProjetoConteudo, "id" | "createdAt">;

type Props = {
  open: boolean;
  mode?: Mode;
  initialValue?: Partial<FormValue> | null;
  onClose: () => void;
  onSave: (payload: FormValue) => void | Promise<void>;
  saving?: boolean;
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
      { value: "publieditorial", label: "Publieditorial" },
      { value: "manchete", label: "Manchete" },
      { value: "artigo-opiniao", label: "Artigo de opinião" },

      // ✅ NOVO
      { value: "publicidade-nativa", label: "Publicidade nativa" },
    ];
  }
  if (canal === "youtube") {
    return [
      { value: "talks", label: "TALKS" },

      // ✅ NOVOS
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

const emptyForm: FormValue = {
  nomeProjeto: "",
  canal: "site" as any,
  tipo: "publieditorial" as any,
  visualizacoes: null,
  segmento: "",
  dataPublicacao: "",
  cliente: "",
  link: "",
  descricao: "",
};

export function NewProjectModal({
  open,
  mode = "create",
  initialValue,
  onClose,
  onSave,
  saving = false,
}: Props) {
  const [form, setForm] = useState<FormValue>(emptyForm);

  useEffect(() => {
    if (!open) return;

    // Quando abre em modo edit, carrega valores
    if (mode === "edit" && initialValue) {
      const merged: FormValue = {
        ...emptyForm,
        ...initialValue,
        // normaliza null/undefined pra string vazia em inputs
        segmento: initialValue.segmento ?? "",
        cliente: initialValue.cliente ?? "",
        dataPublicacao: initialValue.dataPublicacao ?? "",
        descricao: initialValue.descricao ?? "",
        link: initialValue.link ?? "",
        nomeProjeto: initialValue.nomeProjeto ?? "",
        visualizacoes: initialValue.visualizacoes ?? null,
        canal: (initialValue.canal ?? "site") as any,
        tipo: (initialValue.tipo ?? "publieditorial") as any,
      };
      setForm(merged);
      return;
    }

    // create -> limpa
    setForm(emptyForm);
  }, [open, mode, initialValue]);

  const tipos = useMemo(
    () => tiposPorCanal(String(form.canal || "site")),
    [form.canal],
  );

  // Se trocar canal e o tipo não existir mais, ajusta pro primeiro disponível
  useEffect(() => {
    if (!open) return;
    const allowed = tipos.map((t) => t.value);
    if (!allowed.includes(String(form.tipo))) {
      setForm((prev) => ({ ...prev, tipo: allowed[0] as any }));
    }
  }, [open, tipos, form.tipo]);

  if (!open) return null;

  const title = mode === "edit" ? "Editar Projeto" : "Novo Projeto";
  const primaryLabel = mode === "edit" ? "Salvar alterações" : "Salvar";

  function set<K extends keyof FormValue>(key: K, value: FormValue[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    // validações mínimas
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
      segmento: form.segmento?.trim() || "",
      cliente: form.cliente?.trim() || "",
      descricao: form.descricao?.trim() || "",
      dataPublicacao: form.dataPublicacao || "",
      visualizacoes:
        form.visualizacoes === null ||
        form.visualizacoes === undefined ||
        Number.isNaN(Number(form.visualizacoes))
          ? null
          : Number(form.visualizacoes),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={saving ? undefined : onClose}
      />

      <div className="relative w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between gap-3">
          <div>
            <div className="text-white font-extrabold">{title}</div>
            <div className="text-xs text-zinc-400 mt-1">
              {mode === "edit"
                ? "Edite os campos e salve para atualizar o registro."
                : "Cadastre um exemplo comercial para seus executivos utilizarem em vendas."}
            </div>
          </div>

          <button
            className="px-3 py-2 rounded-xl border border-zinc-800 bg-white/5 hover:bg-white/10 disabled:opacity-60"
            onClick={onClose}
            disabled={saving}
          >
            Fechar
          </button>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="text-xs text-zinc-400">Nome do Projeto</label>
            <input
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none"
              value={form.nomeProjeto}
              onChange={(e) => set("nomeProjeto", e.target.value)}
              placeholder="Ex.: Publieditorial — Campanha X"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400">Canal/Página</label>
            <select
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none"
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
            <label className="text-xs text-zinc-400">Tipo</label>
            <select
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none"
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
            <label className="text-xs text-zinc-400">Visualizações</label>
            <input
              type="number"
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none"
              value={form.visualizacoes ?? ""}
              onChange={(e) =>
                set(
                  "visualizacoes",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              placeholder="Ex.: 120000"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400">Segmento</label>
            <input
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none"
              value={form.segmento || ""}
              onChange={(e) => set("segmento", e.target.value)}
              placeholder="Ex.: Varejo, Educação, Saúde..."
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400">Data da publicação</label>
            <input
              type="date"
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none"
              value={form.dataPublicacao || ""}
              onChange={(e) => set("dataPublicacao", e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400">Cliente</label>
            <input
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none"
              value={form.cliente || ""}
              onChange={(e) => set("cliente", e.target.value)}
              placeholder="Ex.: Marca XYZ"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-zinc-400">Link</label>
            <input
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none"
              value={form.link}
              onChange={(e) => set("link", e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-zinc-400">Descrição</label>
            <textarea
              className="mt-1 w-full min-h-[110px] rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none"
              value={form.descricao || ""}
              onChange={(e) => set("descricao", e.target.value)}
              placeholder="Contexto, objetivo comercial, diferencial do formato, observações..."
            />
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 flex items-center justify-end gap-2">
          <button
            className="px-4 py-2 rounded-xl border border-zinc-800 bg-white/5 hover:bg-white/10 disabled:opacity-60"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>

          <button
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-60"
            onClick={submit}
            disabled={saving}
          >
            {saving ? "Salvando..." : primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
