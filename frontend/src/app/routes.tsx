import { Routes, Route } from "react-router-dom";
import { MainLayout } from "../layouts/MainLayout";
import { AllContentsPage } from "../pages/AllContentsPage";
import { ChannelTypePage } from "../pages/ChannelTypePage";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Exceção: Todos os Conteúdos (layout diferente) */}
        <Route path="/" element={<AllContentsPage />} />

        {/* Padrão: telas por canal/tipo */}
        <Route path="/:canal/:tipo" element={<ChannelTypePage />} />
      </Route>
    </Routes>
  );
}
