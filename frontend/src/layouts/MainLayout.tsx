import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { NewProjectModal } from "../components/NewProjectModal";
import { contentStore } from "../storage/contentStore";
import type { ProjetoConteudo } from "../domain/models";
import { canalLabel, tipoLabel } from "../domain/contentTypes";

export function MainLayout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isAll = useMemo(() => location.pathname === "/", [location.pathname]);

  const headerTitle = useMemo(() => {
    if (isAll) return "Todos os Conteúdos";

    const parts = location.pathname.split("/").filter(Boolean);
    const canal = parts[0];
    const tipo = parts[1];

    if (!canal || !tipo) return "Repositório Comercial";
    return `${canalLabel(canal)} • ${tipoLabel(canal, tipo)}`;
  }, [isAll, location.pathname]);

  function handleSave(payload: Omit<ProjetoConteudo, "id" | "createdAt">) {
    const created = contentStore.create(payload);
    setOpen(false);
    navigate(`/${created.canal}/${created.tipo}`);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
          <div className="flex items-center justify-between p-4">
            <div>
              <div className="font-extrabold text-white">{headerTitle}</div>
              <div className="text-xs text-zinc-400 mt-1">
                {isAll
                  ? "Busca e filtros globais em todos os canais"
                  : "Exemplos organizados por canal e formato"}
              </div>
            </div>

            <button
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold"
              onClick={() => setOpen(true)}
            >
              Novo Projeto
            </button>
          </div>
        </header>

        <main className="p-4">
          <Outlet />
        </main>
      </div>

      <NewProjectModal open={open} onClose={() => setOpen(false)} onSave={handleSave} />
    </div>
  );
}
