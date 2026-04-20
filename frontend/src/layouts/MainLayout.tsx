import { Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { NewProjectModal } from "../components/NewProjectModal";
import { contentStore } from "../storage/contentStore";
import type { ProjetoConteudo } from "../domain/models";

export function MainLayout() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);

  const navigate = useNavigate();

  async function handleSave(payload: Omit<ProjetoConteudo, "id" | "createdAt">) {
    try {
      setSaving(true);
      const created = await contentStore.create(payload);
      setOpen(false);
      navigate(`/${created.canal}/${created.tipo}`);
    } catch (e: any) {
      alert(`Erro ao salvar: ${String(e?.message || e)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--rcm-bg)] text-[var(--rcm-text)] flex">
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        desktopCollapsed={desktopSidebarCollapsed}
        onToggleDesktop={() =>
          setDesktopSidebarCollapsed((prev) => !prev)
        }
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onNewProject={() => setOpen(true)}
          onOpenSidebar={() => setMobileSidebarOpen(true)}
          disabled={saving}
        />

        <main className="flex-1 p-3 md:p-4 lg:p-5 min-w-0">
          <Outlet
            context={{
              desktopSidebarCollapsed,
            }}
          />
        </main>

        <Footer />
      </div>

      <NewProjectModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}