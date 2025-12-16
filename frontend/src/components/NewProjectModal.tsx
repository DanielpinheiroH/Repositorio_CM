import { useMemo, useState } from "react";
import type { ProjetoConteudo } from "../domain/models";
import { NAV, type CanalKey, type TipoKey } from "../domain/contentTypes";

type CreatePayload = Omit<ProjetoConteudo, "id" | "createdAt">;

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (payload: CreatePayload) => void;
};

const CANAIS: Array<{ value: CanalKey; label: string }> = [
  { value: "site", label: NAV.site.label },
  { value: "youtube", label: NAV.youtube.label },
  { value: "instagram", label: NAV.instagram.label },
  { value: "tiktok", label: NAV.tiktok.label },
  { value: "kwai", label: NAV.kwai.label },
  { value: "facebook", label: NAV.facebook.label },
];

function tiposPorCanal(canal: CanalKey): Array<{ value: TipoKey; label: string }> {
  const map: Record<string, Array<{ value: TipoKey; label: string }>> = {
    site: NAV.site.items.map((i) => ({ value: i.tipo, label: i.label })),
    youtube: NAV.youtube.items.map((i) => ({ value: i.tipo, label: i.label })),
    instagram: NAV.instagram.items.map((i) => ({ value: i.tipo, label: i.label })),
    tiktok: NAV.tiktok.items.map((i) => ({ value: i.tipo, label: i.label })),
    kwai: NAV.kwai.items.map((i) => ({ value: i.tipo, label: i.label })),
    facebook: NAV.facebook.items.map((i) => ({ value: i.tipo, label: i.label })),
  };
  return map[canal] || [];
}

export function NewProjectModal({ open, onClose, onSave }: Props) {
  const [nomeProjeto, setNomeProjeto] = useState("");
  const [canal, setCanal] = useState<CanalKey>("site");
  const [tipo, setTipo] = useState<TipoKey>("publieditorial");

  const [visualizacoes, setVisualizacoes] = useState<string>("");
  const [segmento, setSegmento] = useState("");
  const [dataPublicacao, setDataPublicacao] = useState("");
  const [cliente, setCliente] = useState("");
  const [link, setLink] = useState("");
  const [descricao, setDescricao] = useState("");

  const tipos = useMemo(() => tiposPorCanal(canal), [canal]);

  function reset() {
    setNomeProjeto("");
    setCanal("site");
    setTipo("publieditorial");
    setVisualizacoes("");
    setSegmento("");
    setDataPublicacao("");
    setCliente("");
    setLink("");
    setDescricao("");
  }

  function close() {
    reset();
    onClose();
  }

  function submit() {
    const nome = nomeProjeto.trim();
    const ln = link.trim();

    if (!nome) return alert("Informe o NOME DO PROJETO.");
    if (!ln) return alert("Informe o LINK.");

    const views = visualizacoes.trim() ? Number(visualizacoes) : null;
    if (visualizacoes.trim() && (Number.isNaN(views) || (views ?? 0) < 0)) {
      return alert("Visualizações precisa ser um número válido (>= 0).");
    }

    onSave({
      nomeProjeto: nome,
      canal,
      tipo,
      visualizacoes: views,
      segmento: segmento.trim() || null,
      dataPublicacao: dataPublicacao.trim() || null,
      cliente: cliente.trim() || null,
      link: ln,
      descricao: descricao.trim() || null,
    });

    close();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden">
        <div className="flex items-start justify-between gap-4 p-4 border-b border-zinc-800">
          <div>
            <div className="text-white font-extrabold">Novo Projeto</div>
            <div className="text-zinc-400 text-sm mt-1">
              Ao salvar, ele entra direto na tela do canal/tipo selecionado.
            </div>
          </div>
          <button
            className="px-3 py-2 rounded-xl border border-zinc-800 text-zinc-200 hover:bg-white/5"
            onClick={close}
          >
            Fechar
          </button>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-zinc-400">NOME DO PROJETO</label>
              <input
                className="mt-1 w-full"
                value={nomeProjeto}
                onChange={(e) => setNomeProjeto(e.target.value)}
                placeholder="Ex.: Case Black Friday — Cliente X"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400">CANAL/PÁGINA</label>
              <select
                className="mt-1 w-full"
                value={canal}
                onChange={(e) => {
                  const next = e.target.value as CanalKey;
                  setCanal(next);
                  const nextTipos = tiposPorCanal(next);
                  setTipo(nextTipos[0]?.value ?? "feed");
                }}
              >
                {CANAIS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-zinc-400">TIPO DO CANAL</label>
              <select
                className="mt-1 w-full"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoKey)}
              >
                {tipos.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-zinc-400">VISUALIZAÇÕES</label>
              <input
                className="mt-1 w-full"
                value={visualizacoes}
                onChange={(e) => setVisualizacoes(e.target.value)}
                placeholder="Ex.: 120000"
                inputMode="numeric"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400">SEGMENTO</label>
              <input
                className="mt-1 w-full"
                value={segmento}
                onChange={(e) => setSegmento(e.target.value)}
                placeholder="Ex.: Varejo, Saúde, Governo..."
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400">DATA DA PUBLICAÇÃO</label>
              <input
                className="mt-1 w-full"
                type="date"
                value={dataPublicacao}
                onChange={(e) => setDataPublicacao(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400">CLIENTE</label>
              <input
                className="mt-1 w-full"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="Ex.: Banco Y"
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs text-zinc-400">LINK</label>
              <input
                className="mt-1 w-full"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs text-zinc-400">DESCRIÇÃO</label>
              <textarea
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-100 outline-none"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Como usar esse exemplo na venda, observações, contexto..."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-zinc-800">
          <button
            className="px-4 py-2 rounded-xl border border-zinc-800 text-zinc-200 hover:bg-white/5"
            onClick={close}
          >
            Cancelar
          </button>
          <button
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold"
            onClick={submit}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
