import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import DocumentacaoPublica from "./pages/DocumentacaoPublica";

// Franqueado
import { FranchiseeLayout } from "./components/layout/FranchiseeLayout";
import FranqueadoHome from "./pages/franqueado/Home";
import EnviarArquivo from "./pages/franqueado/EnviarArquivo";
import MeusArquivos from "./pages/franqueado/MeusArquivos";
import ArquivoDetalhes from "./pages/franqueado/ArquivoDetalhes";
import Atualizacoes from "./pages/franqueado/Atualizacoes";
import Tutoriais from "./pages/franqueado/Tutoriais";
import Materiais from "./pages/franqueado/Materiais";
import Mensagens from "./pages/franqueado/Mensagens";
import Perfil from "./pages/franqueado/Perfil";
import Suporte from "./pages/franqueado/Suporte";
import FranqueadoRelatorios from "./pages/franqueado/Relatorios";
import Cursos from "./pages/franqueado/Cursos";

// Admin
import { AdminLayout } from "./components/layout/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminFranqueados from "./pages/admin/Franqueados";
import AdminArquivos from "./pages/admin/Arquivos";
import AdminArquivoDetalhes from "./pages/admin/ArquivoDetalhes";
import AdminBanners from "./pages/admin/Banners";
import AdminAreas from "./pages/admin/Areas";
import AdminMensagens from "./pages/admin/Mensagens";
import AdminSuporte from "./pages/admin/Suporte";
import AdminRelatorios from "./pages/admin/Relatorios";
import AdminConfiguracoes from "./pages/admin/Configuracoes";
import DocumentacaoSistema from "./pages/admin/DocumentacaoSistema";
import AdminCorrecoes from "./pages/admin/Correcoes";
import AdminContratos from "./pages/admin/Contratos";
import ImportarFranqueados from "./pages/admin/ImportarFranqueados";
import FranqueadoDetalhe from "./pages/admin/FranqueadoDetalhe";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/docs" element={<DocumentacaoPublica />} />

            {/* Franqueado Routes */}
            <Route
              path="/franqueado"
              element={
                <ProtectedRoute allowedRoles={["franqueado"]}>
                  <FranchiseeLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<FranqueadoHome />} />
              <Route path="enviar" element={<EnviarArquivo />} />
              <Route path="arquivos" element={<MeusArquivos />} />
              <Route path="arquivos/:id" element={<ArquivoDetalhes />} />
              <Route path="atualizacoes" element={<Atualizacoes />} />
              <Route path="tutoriais" element={<Tutoriais />} />
              <Route path="materiais" element={<Materiais />} />
              <Route path="mensagens" element={<Mensagens />} />
              <Route path="perfil" element={<Perfil />} />
              <Route path="suporte" element={<Suporte />} />
              <Route path="relatorios" element={<FranqueadoRelatorios />} />
              <Route path="cursos" element={<Cursos />} />
            </Route>

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin", "suporte"]}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="franqueados" element={<AdminFranqueados />} />
              <Route path="franqueados/:id" element={<FranqueadoDetalhe />} />
              <Route path="importar" element={<ImportarFranqueados />} />
              <Route path="arquivos" element={<AdminArquivos />} />
              <Route path="arquivos/:id" element={<AdminArquivoDetalhes />} />
              <Route path="banners" element={<AdminBanners />} />
              <Route path="areas" element={<AdminAreas />} />
              <Route path="mensagens" element={<AdminMensagens />} />
              <Route path="suporte" element={<AdminSuporte />} />
              <Route path="relatorios" element={<AdminRelatorios />} />
              <Route path="configuracoes" element={<AdminConfiguracoes />} />
              <Route path="correcoes" element={<AdminCorrecoes />} />
              <Route path="contratos" element={<AdminContratos />} />
              <Route path="documentacao" element={<DocumentacaoSistema />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
