import { useState, useEffect, useMemo } from "react";
import { Search, Loader2, MapPin, ChevronDown, ChevronRight, Save, X, Download, Upload, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CitiesChipsInput } from "@/components/admin/CitiesChipsInput";

interface ServiceArea {
  country: string;
  state: string;
  city: string;
  city_id: string;
}

interface Franchisee {
  id: string;
  display_name: string | null;
  email: string;
  contract_type: string | null;
  service_areas: ServiceArea[];
}

interface FranchiseeWithChanges extends Franchisee {
  originalAreas: ServiceArea[];
  hasChanges: boolean;
}

export default function GerenciarCobertura() {
  const [franchisees, setFranchisees] = useState<FranchiseeWithChanges[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFranchisees();
  }, []);

  const loadFranchisees = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles_franchisees")
        .select("id, display_name, email, contract_type, service_areas")
        .order("display_name", { ascending: true });

      if (error) throw error;

      const mapped = (data || []).map((f) => {
        const rawAreas = f.service_areas;
        const areas: ServiceArea[] = Array.isArray(rawAreas)
          ? rawAreas.map((a: unknown) => {
              const area = a as Record<string, unknown>;
              return {
                country: String(area.country || ""),
                state: String(area.state || ""),
                city: String(area.city || ""),
                city_id: String(area.city_id || ""),
              };
            })
          : [];

        return {
          id: f.id,
          display_name: f.display_name,
          email: f.email,
          contract_type: f.contract_type,
          service_areas: areas,
          originalAreas: areas,
          hasChanges: false,
        };
      });

      setFranchisees(mapped);
    } catch (error) {
      console.error("Error loading franchisees:", error);
      toast.error("Erro ao carregar franqueados");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFranchisees = useMemo(() => {
    if (!search) return franchisees;
    const searchLower = search.toLowerCase();
    return franchisees.filter(
      (f) =>
        f.display_name?.toLowerCase().includes(searchLower) ||
        f.email.toLowerCase().includes(searchLower)
    );
  }, [franchisees, search]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredFranchisees.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFranchisees.map((f) => f.id)));
    }
  };

  const updateServiceAreas = (id: string, areas: ServiceArea[]) => {
    setFranchisees((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        const hasChanges = JSON.stringify(areas) !== JSON.stringify(f.originalAreas);
        return { ...f, service_areas: areas, hasChanges };
      })
    );
  };

  const getChangedFranchisees = () => franchisees.filter((f) => f.hasChanges);

  const saveChanges = async () => {
    const changed = getChangedFranchisees();
    if (changed.length === 0) {
      toast.info("Nenhuma alteração para salvar");
      return;
    }

    setIsSaving(true);
    try {
      for (const f of changed) {
        const { error } = await supabase
          .from("profiles_franchisees")
          .update({ service_areas: JSON.parse(JSON.stringify(f.service_areas)) })
          .eq("id", f.id);

        if (error) throw error;
      }

      // Update original areas after save
      setFranchisees((prev) =>
        prev.map((f) =>
          f.hasChanges
            ? { ...f, originalAreas: f.service_areas, hasChanges: false }
            : f
        )
      );

      toast.success(`${changed.length} franqueado${changed.length > 1 ? "s" : ""} atualizado${changed.length > 1 ? "s" : ""}`);
    } catch (error) {
      console.error("Error saving changes:", error);
      toast.error("Erro ao salvar alterações");
    } finally {
      setIsSaving(false);
    }
  };

  const discardChanges = () => {
    setFranchisees((prev) =>
      prev.map((f) =>
        f.hasChanges
          ? { ...f, service_areas: f.originalAreas, hasChanges: false }
          : f
      )
    );
    toast.info("Alterações descartadas");
  };

  const expandSelected = () => {
    setExpandedIds((prev) => new Set([...prev, ...selectedIds]));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const exportCSV = () => {
    const rows = franchisees.flatMap((f) =>
      f.service_areas.length > 0
        ? f.service_areas.map((area) => ({
            franqueado_id: f.id,
            email: f.email,
            display_name: f.display_name || "",
            city_id: area.city_id,
            city: area.city,
            state: area.state,
            country: area.country,
          }))
        : [
            {
              franqueado_id: f.id,
              email: f.email,
              display_name: f.display_name || "",
              city_id: "",
              city: "",
              state: "",
              country: "",
            },
          ]
    );

    const headers = ["franqueado_id", "email", "display_name", "city_id", "city", "state", "country"];
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        headers.map((h) => `"${String(row[h as keyof typeof row]).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cobertura_franqueados_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado com sucesso");
  };

  const changedCount = getChangedFranchisees().length;
  const totalCities = franchisees.reduce((acc, f) => acc + f.service_areas.length, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gerenciar Cobertura</h1>
          <p className="text-muted-foreground">
            {franchisees.length} franqueados • {totalCities} cidades cadastradas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          {changedCount > 0 && (
            <>
              <Button variant="ghost" onClick={discardChanges}>
                <X className="h-4 w-4 mr-2" />
                Descartar
              </Button>
              <Button onClick={saveChanges} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar ({changedCount})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar franqueado..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                {selectedIds.size === filteredFranchisees.length ? "Desmarcar todos" : "Selecionar todos"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={expandSelected}
                disabled={selectedIds.size === 0}
              >
                Expandir selecionados
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Recolher todos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Franchisee List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Áreas de Cobertura por Franqueado
          </CardTitle>
          <CardDescription>
            Expanda cada franqueado para editar suas cidades atendidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-2">
              {filteredFranchisees.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {search ? "Nenhum franqueado encontrado" : "Nenhum franqueado cadastrado"}
                </div>
              ) : (
                filteredFranchisees.map((franchisee) => {
                  const isExpanded = expandedIds.has(franchisee.id);
                  const isSelected = selectedIds.has(franchisee.id);

                  return (
                    <Collapsible
                      key={franchisee.id}
                      open={isExpanded}
                      onOpenChange={() => toggleExpanded(franchisee.id)}
                    >
                      <div
                        className={`border rounded-lg transition-colors ${
                          franchisee.hasChanges
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        }`}
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelected(franchisee.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">
                                  {franchisee.display_name || franchisee.email}
                                </span>
                                {franchisee.hasChanges && (
                                  <Badge variant="outline" className="text-primary border-primary">
                                    Alterado
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {franchisee.email}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                {franchisee.contract_type || "Full"}
                              </Badge>
                              <Badge variant="outline" className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {franchisee.service_areas.length}
                              </Badge>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-4 pb-4 pt-2 border-t">
                            <CitiesChipsInput
                              value={franchisee.service_areas}
                              onChange={(areas) => updateServiceAreas(franchisee.id, areas)}
                            />
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Floating save bar */}
      {changedCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <Card className="shadow-lg border-primary/20">
            <CardContent className="flex items-center gap-4 py-3 px-6">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">
                {changedCount} franqueado{changedCount > 1 ? "s" : ""} com alterações pendentes
              </span>
              <Button variant="ghost" size="sm" onClick={discardChanges}>
                Descartar
              </Button>
              <Button size="sm" onClick={saveChanges} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar alterações
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
