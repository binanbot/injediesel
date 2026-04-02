import { Building2, Users, Globe, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MasterDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Painel Master</h1>
        <p className="text-muted-foreground">Visão global do ecossistema de empresas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Empresas Ativas</CardTitle>
            <Building2 className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">1</div>
            <p className="text-xs text-muted-foreground">Injediesel PowerChip</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Domínios</CardTitle>
            <Globe className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">—</div>
            <p className="text-xs text-muted-foreground">Configurados</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Usuários</CardTitle>
            <Users className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">—</div>
            <p className="text-xs text-muted-foreground">Total no sistema</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Perfis</CardTitle>
            <Shield className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">7</div>
            <p className="text-xs text-muted-foreground">Níveis de acesso</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center py-12">
            Os módulos de gestão de empresas, domínios, usuários e permissões serão implementados nas próximas fases.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
