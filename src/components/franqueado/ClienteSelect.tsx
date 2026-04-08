import { useState, useEffect, useMemo } from "react";
import { Check, ChevronsUpDown, Plus, User, Loader2 } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";

export interface CustomerOption {
  id: string;
  full_name: string;
  cpf: string | null;
  cnpj: string | null;
  phone: string | null;
  address_city: string | null;
  address_state: string | null;
  type: string;
  is_active: boolean;
  primary_seller_id: string | null;
}

interface ClienteSelectProps {
  value: string;
  onChange: (clienteId: string) => void;
  /** Called with full customer data when a customer is selected */
  onCustomerSelect?: (customer: CustomerOption | null) => void;
  onAddNew: () => void;
  /** Called after a new customer is created inline, so parent can auto-select */
  refreshSignal?: number;
}

export function ClienteSelect({ value, onChange, onCustomerSelect, onAddNew, refreshSignal }: ClienteSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 250);

  // Load customers from Supabase (unit_id filtered by RLS)
  useEffect(() => {
    loadCustomers();
  }, [refreshSignal]);

  const loadCustomers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("customers")
      .select("id, full_name, cpf, cnpj, phone, address_city, address_state, type, is_active, primary_seller_id")
      .eq("is_active", true)
      .order("full_name");

    if (!error && data) {
      setCustomers(data);
    }
    setIsLoading(false);
  };

  const selected = customers.find((c) => c.id === value);

  const filtered = useMemo(() => {
    if (!debouncedSearch) return customers;
    const q = debouncedSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.cpf?.includes(debouncedSearch) ||
        c.cnpj?.includes(debouncedSearch) ||
        c.phone?.includes(debouncedSearch)
    );
  }, [debouncedSearch, customers]);

  const docLabel = (c: CustomerOption) =>
    c.type === "PJ" ? c.cnpj : c.cpf;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-between h-10 glass-input hover:bg-secondary/50"
            >
              {selected ? (
                <div className="flex items-center gap-2 truncate">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{selected.full_name}</span>
                  {selected.type && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {selected.type}
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
                placeholder="Buscar por nome, CPF/CNPJ ou telefone..."
                value={search}
                onValueChange={setSearch}
                className="border-none focus:ring-0"
              />
              <CommandList>
                {isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <CommandEmpty className="py-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        Nenhum cliente encontrado.
                      </p>
                    </CommandEmpty>
                    <CommandGroup heading="Clientes">
                      {filtered.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={`${c.full_name} ${c.cpf || ""} ${c.cnpj || ""} ${c.phone || ""}`}
                          onSelect={() => {
                            onChange(c.id);
                            setOpen(false);
                          }}
                          className="flex items-center justify-between py-3 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{c.full_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {docLabel(c) || c.phone || "Sem documento"}
                                {c.address_city && ` • ${c.address_city}/${c.address_state || ""}`}
                              </p>
                            </div>
                          </div>
                          <Check
                            className={cn(
                              "h-4 w-4",
                              value === c.id ? "opacity-100 text-primary" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Button type="button" onClick={onAddNew} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>
    </div>
  );
}
