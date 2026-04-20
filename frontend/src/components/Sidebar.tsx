import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { NAV, buildPath } from "../domain/contentTypes";

type Props = {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  desktopCollapsed: boolean;
  onToggleDesktop: () => void;
};

export function Sidebar({
  mobileOpen,
  onCloseMobile,
  desktopCollapsed,
  onToggleDesktop,
}: Props) {
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

  const desktopWidthClass = desktopCollapsed ? "lg:w-[96px]" : "lg:w-[300px]";

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity lg:hidden ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onCloseMobile}
      />

      <aside
        className={`
          rcm-sidebar fixed top-0 left-0 z-50 h-screen w-[300px] max-w-[85vw]
          overflow-y-auto transition-all duration-300 ease-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:sticky lg:top-0 lg:z-30
          ${desktopWidthClass}
        `}
      >
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between gap-3">
            <div
              className={`flex items-center gap-3 min-w-0 ${
                desktopCollapsed ? "lg:justify-center lg:w-full" : ""
              }`}
            >
              <div className="h-12 w-12 rounded-2xl overflow-hidden border border-white/15 bg-black/20 flex items-center justify-center shrink-0 shadow-sm">
                <img
                  src="/logo.gif"
                  alt="Logo"
                  className="h-full w-full object-cover"
                />
              </div>

              {!desktopCollapsed && (
                <div className="min-w-0">
                  <div className="text-[11px] tracking-[0.28em] uppercase text-white/55">
                    REPOSITÓRIO
                  </div>
                  <div className="text-white font-extrabold text-xl leading-none mt-1 truncate">
                    Comercial
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleDesktop}
                className="hidden lg:inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                aria-label={
                  desktopCollapsed
                    ? "Expandir menu lateral"
                    : "Recolher menu lateral"
                }
                title={
                  desktopCollapsed
                    ? "Expandir menu lateral"
                    : "Recolher menu lateral"
                }
              >
                {desktopCollapsed ? "▸" : "◂"}
              </button>

              <button
                type="button"
                onClick={onCloseMobile}
                className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                aria-label="Fechar menu lateral"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <nav className={`p-3 ${desktopCollapsed ? "lg:px-2" : ""}`}>
          {!desktopCollapsed && (
            <>
              <div className="mb-2 px-2 text-[11px] uppercase tracking-[0.22em] text-white/40">
                Navegação
              </div>

              <NavLink
                to={NAV.todos.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  isActive ? "rcm-nav-item-active" : "rcm-nav-item"
                }
              >
                <span className="text-[15px]">Todos os Conteúdos</span>
                <span className="rcm-pill-dot" />
              </NavLink>

              <div className="h-5" />

              <div className="mb-2 px-2 text-[11px] uppercase tracking-[0.22em] text-white/40">
                Canais
              </div>
            </>
          )}

          {desktopCollapsed ? (
            <div className="hidden lg:grid gap-2">
              <NavLink
                to={NAV.todos.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `${
                    isActive ? "rcm-nav-item-active" : "rcm-nav-item"
                  } justify-center px-2`
                }
                title="Todos os Conteúdos"
              >
                <span className="text-lg">◉</span>
              </NavLink>

              {groups.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={onToggleDesktop}
                  className="rcm-nav-item justify-center px-2"
                  title={g.data.label}
                >
                  <span className="text-sm font-bold uppercase">
                    {g.data.label.slice(0, 2)}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            groups.map((g) => (
              <div key={g.key} className="mb-2">
                <button
                  type="button"
                  onClick={() => setOpenGroup(openGroup === g.key ? "" : g.key)}
                  className={
                    openGroup === g.key ? "rcm-nav-item-active" : "rcm-nav-item"
                  }
                >
                  <span className="font-semibold text-[15px]">{g.data.label}</span>
                  <span className="rcm-chevron">
                    {openGroup === g.key ? "▾" : "▸"}
                  </span>
                </button>

                {openGroup === g.key ? (
                  <div className="mt-2 ml-2 pl-3 border-l border-white/10 grid gap-1">
                    {g.data.items.map((it) => (
                      <NavLink
                        key={`${g.key}-${it.tipo}`}
                        to={buildPath(g.key as any, it.tipo)}
                        onClick={onCloseMobile}
                        className={({ isActive }) =>
                          isActive ? "rcm-nav-subitem-active" : "rcm-nav-subitem"
                        }
                      >
                        <span className="truncate text-[14px]">{it.label}</span>
                        <span className="rcm-pill-dot" />
                      </NavLink>
                    ))}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </nav>
      </aside>
    </>
  );
}