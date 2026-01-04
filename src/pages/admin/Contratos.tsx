import { useState, useEffect } from "react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Search, 
  Filter, 
  Calendar as CalendarIcon, 
  Clock, 
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Save,
  Loader2
} from "lucide-react";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface FranchiseeContract {
  id: string;
  user_id: string;
  nome: string | null;
  empresa: string | null;
  contract_expiration_date: string;
  created_at: string;
}

type ContractStatus = "all" | "active" | "expiring" | "expired";

function getContractStatus(expirationDate: string): { status: string; daysRemaining: number } {
  const daysRemaining = differenceInDays(new Date(expirationDate), new Date());
  
  if (daysRemaining < 0) {
    return { status: "expired", daysRemaining };
  }
  if (daysRemaining <= 30) {
    return { status: "expiring", daysRemaining };
  }
  return { status: "active", daysRemaining };
}

function getStatusBadge(status: string, daysRemaining: number) {
  switch (status) {
    case "active":
      return (
        <Badge className="bg-success/20 text-success border-success/30 gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Ativo ({daysRemaining} dias)
        </Badge>
      );
    case "expiring":
      return (
        <Badge className="bg-warning/20 text-warning border-warning/30 gap-1 animate-pulse">
          <AlertTriangle className="h-3 w-3" />
          Vencendo ({daysRemaining} dias)
        </Badge>
      );
    case "expired":
      return (
        <Badge className="bg-destructive/20 text-destructive border-destructive/30 gap-1">
          <XCircle className="h-3 w-3" />
          Vencido ({Math.abs(daysRemaining)} dias)
        </Badge>
      );
    default:
      return null;
  }
}

export default function AdminContratos() {
  const [contracts, setContracts] = useState<FranchiseeContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContractStatus>("all");
  
  // Renewal dialog state
  const [renewalDialogOpen, setRenewalDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<FranchiseeContract | null>(null);
  const [newExpirationDate, setNewExpirationDate] = useState<Date>();
  const [isSaving, setIsSaving] = useState(false);

  // Stats
  const stats = {
    total: contracts.length,
    active: contracts.filter(c => getContractStatus(c.contract_expiration_date).status === "active").length,
    expiring: contracts.filter(c => getContractStatus(c.contract_expiration_date).status === "expiring").length,
    expired: contracts.filter(c => getContractStatus(c.contract_expiration_date).status === "expired").length,
  };

  const fetchContracts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("franchisee_profiles")
        .select("*")
        .order("contract_expiration_date", { ascending: true });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error("Erro ao buscar contratos:", error);
      toast({
        title: "Erro ao carregar contratos",
        description: "Não foi possível carregar a lista de contratos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleOpenRenewal = (contract: FranchiseeContract) => {
    setSelectedContract(contract);
    // Default: add 1 year to current expiration
    const currentExpiration = new Date(contract.contract_expiration_date);
    const newDate = new Date(currentExpiration);
    newDate.setFullYear(newDate.getFullYear() + 1);
    setNewExpirationDate(newDate);
    setRenewalDialogOpen(true);
  };

  const handleSaveRenewal = async () => {
    if (!selectedContract || !newExpirationDate) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("franchisee_profiles")
        .update({ 
          contract_expiration_date: format(newExpirationDate, "yyyy-MM-dd") 
        })
        .eq("id", selectedContract.id);

      if (error) throw error;

      toast({
        title: "Contrato renovado",
        description: `Contrato renovado até ${format(newExpirationDate, "dd/MM/yyyy")}.`,
      });

      setRenewalDialogOpen(false);
      fetchContracts();
    } catch (error) {
      console.error("Erro ao renovar contrato:", error);
      toast({
        title: "Erro ao renovar",
        description: "Não foi possível renovar o contrato. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredContracts = contracts.filter((contract) => {
    const { status } = getContractStatus(contract.contract_expiration_date);
    const searchLower = search.toLowerCase();
    
    const matchesSearch = 
      (contract.nome?.toLowerCase().includes(searchLower) ?? false) ||
      (contract.empresa?.toLowerCase().includes(searchLower) ?? false);
    
    const matchesStatus = statusFilter === "all" || status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Contratos</h1>
          <p className="text-muted-foreground">Gerencie os contratos e renovações dos franqueados.</p>
        </div>
        <Button variant="outline" onClick={fetchContracts} disabled={isLoading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <CalendarIcon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass-card border-success/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ativos</p>
                  <p className="text-3xl font-bold text-success">{stats.active}</p>
                </div>
                <div className="p-3 rounded-xl bg-success/10 text-success">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass-card border-warning/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vencendo</p>
                  <p className="text-3xl font-bold text-warning">{stats.expiring}</p>
                </div>
                <div className="p-3 rounded-xl bg-warning/10 text-warning">
                  <AlertTriangle className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="glass-card border-destructive/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vencidos</p>
                  <p className="text-3xl font-bold text-destructive">{stats.expired}</p>
                </div>
                <div className="p-3 rounded-xl bg-destructive/10 text-destructive">
                  <XCircle className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou empresa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ContractStatus)}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="expiring">Vencendo</SelectItem>
                <SelectItem value="expired">Vencidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {contracts.length === 0 
                  ? "Nenhum contrato cadastrado." 
                  : "Nenhum contrato encontrado com os filtros aplicados."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Franqueado</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Empresa</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Vencimento</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContracts.map((contract) => {
                    const { status, daysRemaining } = getContractStatus(contract.contract_expiration_date);
                    const isUrgent = status === "expired" || (status === "expiring" && daysRemaining <= 7);
                    
                    return (
                      <tr 
                        key={contract.id} 
                        className={cn(
                          "border-b border-border/50 hover:bg-secondary/30 transition-colors",
                          isUrgent && "bg-destructive/5"
                        )}
                      >
                        <td className="py-4 px-4">
                          <p className="font-medium">{contract.nome || "Sem nome"}</p>
                          <p className="text-xs text-muted-foreground">ID: {contract.user_id.slice(0, 8)}...</p>
                        </td>
                        <td className="py-4 px-4 text-muted-foreground">
                          {contract.empresa || "-"}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(contract.contract_expiration_date), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(status, daysRemaining)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end">
                            <Button 
                              size="sm" 
                              onClick={() => handleOpenRenewal(contract)}
                              className="gap-2"
                            >
                              <RefreshCw className="h-4 w-4" />
                              Renovar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination info */}
          {filteredContracts.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Mostrando {filteredContracts.length} de {contracts.length} contratos
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Renewal Dialog */}
      <Dialog open={renewalDialogOpen} onOpenChange={setRenewalDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Renovar Contrato
            </DialogTitle>
            <DialogDescription>
              Selecione a nova data de vencimento do contrato.
            </DialogDescription>
          </DialogHeader>

          {selectedContract && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-secondary/30 rounded-lg space-y-2">
                <p className="font-medium">{selectedContract.nome || "Sem nome"}</p>
                {selectedContract.empresa && (
                  <p className="text-sm text-muted-foreground">{selectedContract.empresa}</p>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Vencimento atual: </span>
                  <span className="font-medium">
                    {format(new Date(selectedContract.contract_expiration_date), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Nova data de vencimento</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newExpirationDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newExpirationDate 
                        ? format(newExpirationDate, "dd/MM/yyyy", { locale: ptBR }) 
                        : "Selecionar data"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newExpirationDate}
                      onSelect={setNewExpirationDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {newExpirationDate && (
                <div className="p-3 bg-success/10 border border-success/30 rounded-lg">
                  <p className="text-sm text-success flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    O contrato será válido por mais{" "}
                    <strong>{differenceInDays(newExpirationDate, new Date())} dias</strong>
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRenewalDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveRenewal} 
              disabled={!newExpirationDate || isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar Renovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
