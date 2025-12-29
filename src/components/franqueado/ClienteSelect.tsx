import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Plus, User, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Cliente, clientesMock, servicosClientesMock } from "@/data/clientes-mock";

interface ClienteSelectProps {
  value: string;
  onChange: (clienteId: string) => void;
  onAddNew: () => void;
  onViewCliente: (cliente: Cliente) => void;
}

export function ClienteSelect({ value, onChange, onAddNew, onViewCliente }: ClienteSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Contar serviços por cliente
  const servicosPorCliente = useMemo(() => {
    const count: Record<string, number> = {};
    servicosClientesMock.forEach((s) => {
      count[s.clienteId] = (count[s.clienteId] || 0) + 1;
    });
    return count;
  }, []);

  const clienteSelecionado = clientesMock.find((c) => c.id === value);
  const totalServicos = value ? servicosPorCliente[value] || 0 : 0;

  const clientesFiltrados = useMemo(() => {
    if (!search) return clientesMock;
    const searchLower = search.toLowerCase();
    return clientesMock.filter(
      (c) =>
        c.nome.toLowerCase().includes(searchLower) ||
        c.telefone.includes(search) ||
        c.cidade?.toLowerCase().includes(searchLower)
    );
  }, [search]);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {/* Select de cliente */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-between h-10 glass-input hover:bg-secondary/50"
            >
              {clienteSelecionado ? (
                <div className="flex items-center gap-2 truncate">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{clienteSelecionado.nome}</span>
                  {totalServicos > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {totalServicos} serviço{totalServicos > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground">Selecione o cliente</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0 glass-card" align="start">
            <Command className="bg-transparent">
              <CommandInput
                placeholder="Buscar cliente por nome, telefone ou cidade..."
                value={search}
                onValueChange={setSearch}
                className="border-none focus:ring-0"
              />
              <CommandList>
                <CommandEmpty className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhum cliente encontrado.
                  </p>
                </CommandEmpty>
                <CommandGroup heading="Clientes">
                  {clientesFiltrados.map((cliente) => {
                    const qtdServicos = servicosPorCliente[cliente.id] || 0;
                    return (
                      <CommandItem
                        key={cliente.id}
                        value={cliente.id}
                        onSelect={() => {
                          onChange(cliente.id);
                          setOpen(false);
                        }}
                        className="flex items-center justify-between py-3 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{cliente.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {cliente.telefone} {cliente.cidade && `• ${cliente.cidade}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {qtdServicos > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <History className="h-3 w-3 mr-1" />
                              {qtdServicos}
                            </Badge>
                          )}
                          <Check
                            className={cn(
                              "h-4 w-4",
                              value === cliente.id ? "opacity-100 text-primary" : "opacity-0"
                            )}
                          />
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Botão Adicionar Novo Cliente */}
        <Button
          type="button"
          onClick={onAddNew}
          className="shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Novo Cliente
        </Button>
      </div>

      {/* Info do cliente selecionado */}
      {clienteSelecionado && totalServicos > 0 && (
        <div className="flex items-center justify-between p-2 rounded-lg bg-info/10 border border-info/20">
          <p className="text-xs text-info">
            Este cliente já possui {totalServicos} serviço{totalServicos > 1 ? "s" : ""} anterior{totalServicos > 1 ? "es" : ""}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-info hover:text-info"
            onClick={() => onViewCliente(clienteSelecionado)}
          >
            Ver histórico
          </Button>
        </div>
      )}
    </div>
  );
}
