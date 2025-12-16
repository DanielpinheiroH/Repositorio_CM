import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { NAV, buildPath } from "../domain/contentTypes";

export function Sidebar() {
  const [openGroup, setOpenGroup] = useState<string>("site");

  const groups = useMemo(
    () => [
      { key: "site", data: NAV.site },
      { key: "youtube", data: NAV.youtube },
      { key: "instagram", data: NAV.instagram },
      { key: "tiktok", data: NAV.tiktok },
      { key: "kwai", data: NAV.kwai },
      { key: "facebook", data: NAV.facebook },
    ],
    [],
  );

  return (
    <aside className="rcm-sidebar w-[280px] shrink-0 h-screen sticky top-0 overflow-y-auto">
      {/* Header do sidebar (mesmo conteúdo, visual novo) */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
            <span className="text-white font-extrabold">R</span>
          </div>

          <div className="min-w-0">
            <div className="text-[11px] tracking-[0.22em] uppercase text-white/60">
              REPOSITÓRIO
            </div>
            <div className="text-white font-extrabold">Comercial</div>
          </div>
        </div>
      </div>

      <nav className="p-3">
        {/* Todos os Conteúdos (mesma rota) */}
        <NavLink
          to={NAV.todos.path}
          className={({ isActive }) => (isActive ? "rcm-nav-item-active" : "rcm-nav-item")}
        >
          <span>Todos os Conteúdos</span>
          <span className="rcm-pill-dot" />
        </NavLink>

        <div className="h-4" />

        {groups.map((g) => (
          <div key={g.key} className="mb-3">
            {/* Botão do grupo (mesma lógica open/close) */}
            <button
              type="button"
              onClick={() => setOpenGroup(openGroup === g.key ? "" : g.key)}
              className={openGroup === g.key ? "rcm-nav-item-active" : "rcm-nav-item"}
            >
              <span className="font-semibold">{g.data.label}</span>
              <span className="rcm-chevron">{openGroup === g.key ? "▾" : "▸"}</span>
            </button>

            {openGroup === g.key ? (
              <div className="mt-2 grid gap-1 pl-2">
                {g.data.items.map((it) => (
                  <NavLink
                    key={`${g.key}-${it.tipo}`}
                    to={buildPath(g.key as any, it.tipo)}
                    className={({ isActive }) =>
                      isActive ? "rcm-nav-item-active" : "rcm-nav-item"
                    }
                  >
                    <span className="truncate">{it.label}</span>
                    <span className="rcm-pill-dot" />
                  </NavLink>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </nav>
    </aside>
  );
}
