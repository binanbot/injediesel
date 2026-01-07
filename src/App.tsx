import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";

// Fallback component for lazy loading
const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Non-lazy pages (critical path)
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Lazy-loaded pages - Franqueado (less critical)
const FranqueadoHome = lazy(() => import("./pages/franqueado/Home"));
const EnviarArquivo = lazy(() => import("./pages/franqueado/EnviarArquivo"));
const MeusArquivos = lazy(() => import("./pages/franqueado/MeusArquivos"));
const ArquivoDetalhes = lazy(() => import("./pages/franqueado/ArquivoDetalhes"));
const Atualizacoes = lazy(() => import("./pages/franqueado/Atualizacoes"));
const Tutoriais = lazy(() => import("./pages/franqueado/Tutoriais"));
const Materiais = lazy(() => import("./pages/franqueado/Materiais"));
const Mensagens = lazy(() => import("./pages/franqueado/Mensagens"));
const Perfil = lazy(() => import("./pages/franqueado/Perfil"));
const Suporte = lazy(() => import("./pages/franqueado/Suporte"));
const FranqueadoRelatorios = lazy(() => import("./pages/franqueado/Relatorios"));
const Cursos = lazy(() => import("./pages/franqueado/Cursos"));
const Loja = lazy(() => import("./pages/franqueado/Loja"));
const LojaCheckout = lazy(() => import("./pages/franqueado/LojaCheckout"));
const Carrinho = lazy(() => import("./pages/franqueado/Carrinho"));
const MeusPedidos = lazy(() => import("./pages/franqueado/MeusPedidos"));
const PedidoDetalhe = lazy(() => import("./pages/franqueado/PedidoDetalhe"));
import LandingLancamento from "./pages/franqueado/LandingLancamento";
const DocumentacaoPublica = lazy(() => import("./pages/DocumentacaoPublica"));

// Lazy-loaded pages - Admin (heavy pages)
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminFranqueados = lazy(() => import("./pages/admin/Franqueados"));
const AdminArquivos = lazy(() => import("./pages/admin/Arquivos"));
const AdminArquivoDetalhes = lazy(() => import("./pages/admin/ArquivoDetalhes"));
const AdminBanners = lazy(() => import("./pages/admin/Banners"));
const AdminAreas = lazy(() => import("./pages/admin/Areas"));
const AdminMensagens = lazy(() => import("./pages/admin/Mensagens"));
const AdminSuporte = lazy(() => import("./pages/admin/Suporte"));
const AdminRelatorios = lazy(() => import("./pages/admin/Relatorios"));
const AdminConfiguracoes = lazy(() => import("./pages/admin/Configuracoes"));
const DocumentacaoSistema = lazy(() => import("./pages/admin/DocumentacaoSistema"));
const AdminCorrecoes = lazy(() => import("./pages/admin/Correcoes"));
const AdminContratos = lazy(() => import("./pages/admin/Contratos"));
const ImportarFranqueados = lazy(() => import("./pages/admin/ImportarFranqueados"));
const FranqueadoDetalhe = lazy(() => import("./pages/admin/FranqueadoDetalhe"));
const GerenciarCobertura = lazy(() => import("./pages/admin/GerenciarCobertura"));
const Clientes = lazy(() => import("./pages/admin/Clientes"));
const ClienteDetalhe = lazy(() => import("./pages/admin/ClienteDetalhe"));
const ImportarProdutos = lazy(() => import("./pages/admin/ImportarProdutos"));
const ComprasFranqueados = lazy(() => import("./pages/admin/ComprasFranqueados"));
const CompraDetalhe = lazy(() => import("./pages/admin/CompraDetalhe"));
const Produtos = lazy(() => import("./pages/admin/Produtos"));

// Layouts (keep non-lazy for instant routing)
import { FranchiseeLayout } from "./components/layout/FranchiseeLayout";
import { AdminLayout } from "./components/layout/AdminLayout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingLancamento />} />
              <Route path="/login" element={<Login />} />
              <Route path="/landing-old" element={<Landing />} />
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
                <Route path="enviar" element={
                  <ErrorBoundary moduleName="Enviar Arquivo">
                    <EnviarArquivo />
                  </ErrorBoundary>
                } />
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
                <Route path="loja" element={
                  <ErrorBoundary moduleName="Loja">
                    <Loja />
                  </ErrorBoundary>
                } />
                <Route path="loja/carrinho" element={<Carrinho />} />
                <Route path="loja/checkout" element={
                  <ErrorBoundary moduleName="Checkout">
                    <LojaCheckout />
                  </ErrorBoundary>
                } />
                <Route path="loja/pedidos" element={<MeusPedidos />} />
                <Route path="loja/pedidos/:id" element={<PedidoDetalhe />} />
                
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
                <Route path="importar" element={
                  <ErrorBoundary moduleName="Importar Franqueados">
                    <ImportarFranqueados />
                  </ErrorBoundary>
                } />
                <Route path="cobertura" element={
                  <ErrorBoundary moduleName="Mapa de Cobertura">
                    <GerenciarCobertura />
                  </ErrorBoundary>
                } />
                <Route path="clientes" element={<Clientes />} />
                <Route path="clientes/:id" element={<ClienteDetalhe />} />
                <Route path="arquivos" element={<AdminArquivos />} />
                <Route path="arquivos/:id" element={<AdminArquivoDetalhes />} />
                <Route path="banners" element={<AdminBanners />} />
                <Route path="areas" element={<AdminAreas />} />
                <Route path="mensagens" element={<AdminMensagens />} />
                <Route path="suporte" element={<AdminSuporte />} />
                <Route path="relatorios" element={
                  <ErrorBoundary moduleName="Relatórios">
                    <AdminRelatorios />
                  </ErrorBoundary>
                } />
                <Route path="configuracoes" element={<AdminConfiguracoes />} />
                <Route path="correcoes" element={<AdminCorrecoes />} />
                <Route path="contratos" element={<AdminContratos />} />
                <Route path="documentacao" element={<DocumentacaoSistema />} />
                <Route path="produtos" element={<Produtos />} />
                <Route path="importar-produtos" element={
                  <ErrorBoundary moduleName="Importar Produtos">
                    <ImportarProdutos />
                  </ErrorBoundary>
                } />
                <Route path="compras" element={<ComprasFranqueados />} />
                <Route path="compras/:id" element={<CompraDetalhe />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
