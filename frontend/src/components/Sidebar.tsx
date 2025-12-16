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

  const baseItem =
    "w-full px-3 py-2 rounded-xl text-sm transition border border-transparent";
  const activeItem =
    "bg-red-500/10 border-red-500/30 text-white";
  const idleItem =
    "text-zinc-300 hover:bg-white/5 hover:text-white";

  return (
    <aside className="w-[280px] shrink-0 border-r border-zinc-800 bg-zinc-950">
      <div className="p-4 border-b border-zinc-800">
        <div className="text-white font-extrabold tracking-tight">Repositório</div>
        <div className="text-zinc-400 text-xs mt-1">Comercial</div>
      </div>

      <nav className="p-3">
        <NavLink
          to={NAV.todos.path}
          className={({ isActive }) =>
            `${baseItem} ${isActive ? activeItem : idleItem}`
          }
        >
          Todos os Conteúdos
        </NavLink>

        <div className="h-3" />

        {groups.map((g) => (
          <div key={g.key} className="mb-2">
            <button
              type="button"
              onClick={() => setOpenGroup(openGroup === g.key ? "" : g.key)}
              className={`${baseItem} ${openGroup === g.key ? "bg-white/5 text-white border-zinc-800" : idleItem} flex items-center justify-between`}
            >
              <span>{g.data.label}</span>
              <span className="text-zinc-400">
                {openGroup === g.key ? "▾" : "▸"}
              </span>
            </button>

            {openGroup === g.key ? (
              <div className="mt-2 grid gap-1 pl-2">
                {g.data.items.map((it) => (
                  <NavLink
                    key={`${g.key}-${it.tipo}`}
                    to={buildPath(g.key as any, it.tipo)}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-xl text-sm border transition ${
                        isActive
                          ? "bg-red-500/10 border-red-500/30 text-white"
                          : "border-transparent text-zinc-400 hover:text-white hover:bg-white/5"
                      }`
                    }
                  >
                    {it.label}
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
