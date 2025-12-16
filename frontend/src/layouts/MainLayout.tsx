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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onNewProject={() => setOpen(true)} disabled={saving} />

        <main className="flex-1 p-4 min-w-0">
          <Outlet />
        </main>

        <Footer />
      </div>

      <NewProjectModal open={open} onClose={() => setOpen(false)} onSave={handleSave} saving={saving} />
    </div>
  );
}
