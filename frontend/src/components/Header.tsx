type Props = {
  onNewProject: () => void;
  disabled?: boolean;
};

export function Header({ onNewProject, disabled = false }: Props) {
  return (
    <header className="rcm-topbar">
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="text-xs text-white/80">
          Repositório Comercial - painel interno
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[11px] text-white/50">v0.1</div>
          <div className="text-[11px] text-white/35">API</div>

          <button className="rcm-btn-primary" onClick={onNewProject} disabled={disabled}>
            Novo Projeto
          </button>
        </div>
      </div>
    </header>
  );
}
