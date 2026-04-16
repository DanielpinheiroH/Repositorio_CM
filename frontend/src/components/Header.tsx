type Props = {
  onOpenSidebar: () => void;
  onNewProject: () => void;
  disabled?: boolean;
};

export function Header({
  onOpenSidebar,
  onNewProject,
  disabled = false,
}: Props) {
  return (
    <header className="bg-gradient-to-b from-[#4b0d15] to-[#2a080d] border-b border-white/10">
      <div className="px-4 md:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="lg:hidden inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
            aria-label="Abrir menu lateral"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/50">
              Painel interno
            </div>

            <div className="text-[16px] font-extrabold text-white leading-tight truncate">
              Repositório Comercial
            </div>

            <div className="hidden sm:block text-xs text-white/45 mt-0.5 truncate">
              Biblioteca de conteúdos para apoio comercial
            </div>
          </div>
        </div>

        <button
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#e11d2e] to-[#c40f1d] px-3 md:px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(213,22,32,0.25)] transition hover:-translate-y-[1px] disabled:opacity-60 shrink-0"
          onClick={onNewProject}
          disabled={disabled}
        >
          + Novo Projeto
        </button>
      </div>
    </header>
  );
}