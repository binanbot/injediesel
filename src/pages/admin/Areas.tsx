import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Search, Filter, Eye, Plus, AlertTriangle, X, Building2, FileText, Calendar } from "lucide-react";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import CoverageMap from "@/components/admin/CoverageMap";

interface CityWithCoverage {
  city: string;
  state: string;
  country: string;
  franchisees: {
    id: string;
    name: string;
    contractType: string;
    isExpired: boolean;
  }[];
  isExclusive: boolean;
}

interface Franchisee {
  id: string;
  display_name: string;
  email: string;
}

// Brazilian states
const estados = [
  { uf: "AC", nome: "Acre" },
  { uf: "AL", nome: "Alagoas" },
  { uf: "AP", nome: "Amapá" },
  { uf: "AM", nome: "Amazonas" },
  { uf: "BA", nome: "Bahia" },
  { uf: "CE", nome: "Ceará" },
  { uf: "DF", nome: "Distrito Federal" },
  { uf: "ES", nome: "Espírito Santo" },
  { uf: "GO", nome: "Goiás" },
  { uf: "MA", nome: "Maranhão" },
  { uf: "MT", nome: "Mato Grosso" },
  { uf: "MS", nome: "Mato Grosso do Sul" },
  { uf: "MG", nome: "Minas Gerais" },
  { uf: "PA", nome: "Pará" },
  { uf: "PB", nome: "Paraíba" },
  { uf: "PR", nome: "Paraná" },
  { uf: "PE", nome: "Pernambuco" },
  { uf: "PI", nome: "Piauí" },
  { uf: "RJ", nome: "Rio de Janeiro" },
  { uf: "RN", nome: "Rio Grande do Norte" },
  { uf: "RS", nome: "Rio Grande do Sul" },
  { uf: "RO", nome: "Rondônia" },
  { uf: "RR", nome: "Roraima" },
  { uf: "SC", nome: "Santa Catarina" },
  { uf: "SP", nome: "São Paulo" },
  { uf: "SE", nome: "Sergipe" },
  { uf: "TO", nome: "Tocantins" },
];

export default function AdminAreas() {
  const [filterUf, setFilterUf] = useState<string>("all");
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [filterUnidade, setFilterUnidade] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [selectedCity, setSelectedCity] = useState<CityWithCoverage | null>(null);
  const [franchisees, setFranchisees] = useState<Franchisee[]>([]);

  // Fetch franchisees for filter
  useEffect(() => {
    const fetchFranchisees = async () => {
      const { data } = await supabase
        .from('profiles_franchisees')
        .select('id, display_name, email')
        .order('display_name');
      
      if (data) {
        setFranchisees(data);
      }
    };
    fetchFranchisees();
  }, []);

  const handleCityClick = (city: CityWithCoverage) => {
    setSelectedCity(city);
  };

  const clearFilters = () => {
    setFilterUf("all");
    setFilterTipo("all");
    setFilterUnidade("all");
    setSearchTerm("");
  };

  const hasActiveFilters = filterUf !== "all" || filterTipo !== "all" || filterUnidade !== "all";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Áreas de Atuação</h1>
          <p className="text-muted-foreground">Visualize a cobertura geográfica das unidades franqueadas.</p>
        </div>
        <Button variant="hero">
          <Plus className="h-4 w-4" />
          Adicionar Área
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar cidade..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={filterUf} onValueChange={setFilterUf}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filtrar por UF" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                {estados.map((e) => (
                  <SelectItem key={e.uf} value={e.uf}>{e.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Tipo de revenda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="full">Full</SelectItem>
                <SelectItem value="leve">Leve</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterUnidade} onValueChange={setFilterUnidade}>
              <SelectTrigger className="w-full lg:w-56">
                <SelectValue placeholder="Filtrar por unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as unidades</SelectItem>
                {franchisees.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.display_name || f.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters} title="Limpar filtros">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Active filters chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-4">
              {filterUf !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  UF: {filterUf}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterUf("all")} />
                </Badge>
              )}
              {filterTipo !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Tipo: {filterTipo}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterTipo("all")} />
                </Badge>
              )}
              {filterUnidade !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Unidade: {franchisees.find(f => f.id === filterUnidade)?.display_name || 'Selecionada'}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterUnidade("all")} />
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Mapa de Cobertura
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CoverageMap
            filterUf={filterUf}
            filterTipo={filterTipo}
            filterUnidade={filterUnidade}
            onCityClick={handleCityClick}
          />
        </CardContent>
      </Card>

      {/* City Detail Sheet */}
      <Sheet open={!!selectedCity} onOpenChange={(open) => !open && setSelectedCity(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              {selectedCity?.city}
            </SheetTitle>
          </SheetHeader>
          
          {selectedCity && (
            <div className="mt-6 space-y-6">
              {/* City info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Estado</span>
                  <Badge variant="outline">{selectedCity.state}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">País</span>
                  <span>{selectedCity.country === 'BR' ? 'Brasil' : selectedCity.country}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tipo de cobertura</span>
                  <Badge 
                    className={selectedCity.isExclusive 
                      ? "bg-red-500/20 text-red-600 border-red-500/30" 
                      : "bg-orange-500/20 text-orange-600 border-orange-500/30"
                    }
                  >
                    {selectedCity.isExclusive ? 'Exclusiva' : 'Compartilhada'}
                  </Badge>
                </div>
              </div>

              {/* Franchisees list */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Unidades Responsáveis ({selectedCity.franchisees.length})
                </h4>
                
                <div className="space-y-3">
                  {selectedCity.franchisees.map((franchisee) => (
                    <motion.div
                      key={franchisee.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-lg border ${
                        franchisee.isExpired 
                          ? 'bg-destructive/5 border-destructive/20' 
                          : 'bg-primary/5 border-primary/20'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{franchisee.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              <FileText className="h-3 w-3 mr-1" />
                              {franchisee.contractType}
                            </Badge>
                          </div>
                        </div>
                        <Badge 
                          variant={franchisee.isExpired ? "destructive" : "default"}
                          className={!franchisee.isExpired ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/30" : ""}
                        >
                          {franchisee.isExpired ? 'Vencido' : 'Ativo'}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedCity(null)}>
                  Fechar
                </Button>
                <Button variant="hero" className="flex-1">
                  <Eye className="h-4 w-4" />
                  Ver Unidade
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
