import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Search, Filter, Eye, Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const estados = [
  { uf: "SP", nome: "São Paulo", cidades: 45, unidades: 8 },
  { uf: "RJ", nome: "Rio de Janeiro", cidades: 18, unidades: 3 },
  { uf: "MG", nome: "Minas Gerais", cidades: 22, unidades: 4 },
  { uf: "PR", nome: "Paraná", cidades: 15, unidades: 3 },
  { uf: "RS", nome: "Rio Grande do Sul", cidades: 12, unidades: 2 },
  { uf: "SC", nome: "Santa Catarina", cidades: 10, unidades: 2 },
  { uf: "BA", nome: "Bahia", cidades: 8, unidades: 1 },
  { uf: "GO", nome: "Goiás", cidades: 6, unidades: 1 },
];

const cidadesExemplo = [
  { nome: "São Paulo", unidade: "São Paulo - Centro", tipo: "Full" },
  { nome: "Guarulhos", unidade: "São Paulo - Centro", tipo: "Full" },
  { nome: "Osasco", unidade: "São Paulo - Centro", tipo: "Full" },
  { nome: "Campinas", unidade: "Campinas", tipo: "Leve" },
  { nome: "Ribeirão Preto", unidade: null, tipo: null },
  { nome: "Santos", unidade: "Santos", tipo: "Leve" },
];

export default function AdminAreas() {
  const [selectedEstado, setSelectedEstado] = useState<string | null>(null);
  const [conflictDialog, setConflictDialog] = useState<{ open: boolean; cidade: string; unidade: string }>({
    open: false,
    cidade: "",
    unidade: "",
  });

  const handleCidadeClick = (cidade: typeof cidadesExemplo[0]) => {
    if (cidade.unidade) {
      setConflictDialog({
        open: true,
        cidade: cidade.nome,
        unidade: cidade.unidade,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Áreas de Atuação</h1>
          <p className="text-muted-foreground">Gerencie as áreas de atuação das unidades franqueadas.</p>
        </div>
        <Button variant="hero">
          <Plus className="h-4 w-4" />
          Adicionar Área
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar cidade..." className="pl-10" />
            </div>
            <Select>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por UF" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                {estados.map((e) => (
                  <SelectItem key={e.uf} value={e.uf}>{e.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Tipo de revenda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="full">Full</SelectItem>
                <SelectItem value="leve">Leve</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Map Placeholder + Stats */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Mapa do Brasil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-[4/3] bg-secondary/50 rounded-xl flex items-center justify-center relative overflow-hidden">
              {/* Simplified Brazil map representation */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <div className="text-center z-10">
                <MapPin className="h-16 w-16 text-primary/30 mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">Mapa interativo do Brasil</p>
                <p className="text-sm text-muted-foreground">156 cidades atendidas em 8 estados</p>
              </div>
              
              {/* Sample markers */}
              <div className="absolute top-1/4 left-1/3 w-4 h-4 bg-primary rounded-full animate-pulse" title="São Paulo" />
              <div className="absolute top-1/3 left-[45%] w-3 h-3 bg-primary/70 rounded-full animate-pulse" title="Rio de Janeiro" />
              <div className="absolute top-[40%] left-1/4 w-3 h-3 bg-primary/70 rounded-full animate-pulse" title="Belo Horizonte" />
              <div className="absolute top-[60%] left-1/3 w-3 h-3 bg-primary/50 rounded-full animate-pulse" title="Curitiba" />
              <div className="absolute top-[70%] left-1/4 w-3 h-3 bg-primary/50 rounded-full animate-pulse" title="Porto Alegre" />
            </div>
          </CardContent>
        </Card>

        {/* States List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estados com Cobertura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {estados.map((estado) => (
                <motion.div
                  key={estado.uf}
                  whileHover={{ scale: 1.02 }}
                  className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors"
                  onClick={() => setSelectedEstado(estado.uf)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{estado.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {estado.cidades} cidades • {estado.unidades} unidades
                      </p>
                    </div>
                    <Badge variant="outline">{estado.uf}</Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cities Detail */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cidades - São Paulo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cidadesExemplo.map((cidade) => (
              <div
                key={cidade.nome}
                onClick={() => handleCidadeClick(cidade)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  cidade.unidade
                    ? "bg-primary/5 border-primary/30 hover:border-primary/50"
                    : "bg-secondary/30 border-border hover:border-primary/30"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{cidade.nome}</p>
                    {cidade.unidade ? (
                      <p className="text-sm text-muted-foreground">{cidade.unidade}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Sem cobertura</p>
                    )}
                  </div>
                  {cidade.tipo && (
                    <Badge className={cidade.tipo === "Full" ? "bg-primary/20 text-primary" : ""} variant="outline">
                      {cidade.tipo}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conflict Dialog */}
      <Dialog open={conflictDialog.open} onOpenChange={(open) => setConflictDialog({ ...conflictDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Cidade já atendida
            </DialogTitle>
            <DialogDescription>
              A cidade <strong>{conflictDialog.cidade}</strong> já está sendo atendida pela unidade{" "}
              <strong>{conflictDialog.unidade}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 justify-end">
            <Button variant="outline" onClick={() => setConflictDialog({ open: false, cidade: "", unidade: "" })}>
              Fechar
            </Button>
            <Button variant="hero">
              <Eye className="h-4 w-4" />
              Ver unidade
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
