import { useState, useEffect, useRef } from "react";
import { Search, Loader2, MapPin, CheckCircle, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface CityReference {
  id: string;
  country: string;
  state: string;
  city: string;
  search_key: string;
}

interface FranchiseeWithCity {
  id: string;
  display_name: string | null;
  email: string;
  contract_type: string | null;
  contract_expiration_date: string | null;
  created_at: string | null;
}

interface SearchResult {
  city: CityReference;
  franchisees: FranchiseeWithCity[];
  isAvailable: boolean;
}

const normalizeSearchKey = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

export function CitySearchBox() {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<CityReference[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchCities = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const searchKey = normalizeSearchKey(query);
      const { data, error } = await supabase
        .from("cities_reference")
        .select("*")
        .ilike("search_key", `%${searchKey}%`)
        .limit(15);

      if (error) throw error;
      setSuggestions(data || []);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error("Error searching cities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSearchResult(null);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchCities(newValue);
    }, 300);
  };

  const selectCity = async (city: CityReference) => {
    setInputValue(`${city.city} - ${city.state} (${city.country})`);
    setShowSuggestions(false);
    setSuggestions([]);
    setIsLoading(true);

    try {
      // Search for franchisees that serve this city
      const { data: franchisees, error } = await supabase
        .from("profiles_franchisees")
        .select("id, display_name, email, contract_type, contract_expiration_date, created_at, service_areas")
        .not("service_areas", "is", null);

      if (error) throw error;

      // Filter franchisees that have this city in their service_areas
      const matchingFranchisees = (franchisees || []).filter((f) => {
        const serviceAreas = f.service_areas as unknown[];
        if (!Array.isArray(serviceAreas)) return false;
        return serviceAreas.some((area: unknown) => {
          const typedArea = area as { city_id?: string };
          return typedArea.city_id === city.id;
        });
      });

      // Sort by: active status, then by created_at (oldest first)
      const today = new Date().toISOString().split("T")[0];
      const sortedFranchisees = matchingFranchisees.sort((a, b) => {
        const aActive = a.contract_expiration_date && a.contract_expiration_date >= today;
        const bActive = b.contract_expiration_date && b.contract_expiration_date >= today;
        
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        
        const aDate = a.created_at || "";
        const bDate = b.created_at || "";
        return aDate.localeCompare(bDate);
      });

      setSearchResult({
        city,
        franchisees: sortedFranchisees.map((f) => ({
          id: f.id,
          display_name: f.display_name,
          email: f.email,
          contract_type: f.contract_type,
          contract_expiration_date: f.contract_expiration_date,
          created_at: f.created_at,
        })),
        isAvailable: sortedFranchisees.length === 0,
      });
    } catch (error) {
      console.error("Error searching franchisees:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      selectCity(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const clearSearch = () => {
    setInputValue("");
    setSearchResult(null);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const getContractStatus = (expirationDate: string | null) => {
    if (!expirationDate) return { label: "Sem contrato", variant: "outline" as const };
    
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: "Vencido", variant: "destructive" as const };
    if (diffDays <= 30) return { label: "Vencendo", variant: "secondary" as const };
    return { label: "Ativo", variant: "default" as const };
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => inputValue.length >= 2 && setShowSuggestions(true)}
            placeholder="Buscar cidade atendida..."
            className="pl-10 pr-10"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto"
          >
            {suggestions.map((city, index) => (
              <button
                key={city.id}
                type="button"
                onClick={() => selectCity(city)}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2",
                  index === selectedIndex && "bg-accent"
                )}
              >
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>
                  {city.city} - {city.state}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {city.country === "BR" ? "🇧🇷" : "🇵🇾"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {searchResult && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="font-medium">
                {searchResult.city.city} - {searchResult.city.state}
              </span>
              <Badge variant="outline" className="ml-auto">
                {searchResult.city.country === "BR" ? "🇧🇷 Brasil" : "🇵🇾 Paraguai"}
              </Badge>
              <Button variant="ghost" size="sm" onClick={clearSearch}>
                Limpar
              </Button>
            </div>

            {searchResult.isAvailable ? (
              <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">
                    Cidade disponível
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-500">
                    Nenhuma franquia atende esta cidade
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {searchResult.franchisees.length === 1
                    ? "1 franquia atende esta cidade:"
                    : `${searchResult.franchisees.length} franquias atendem esta cidade:`}
                </p>

                {searchResult.franchisees.map((franchisee, index) => {
                  const status = getContractStatus(franchisee.contract_expiration_date);
                  return (
                    <div
                      key={franchisee.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border",
                        index === 0 && "bg-primary/5 border-primary/20"
                      )}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {franchisee.display_name || franchisee.email}
                          </span>
                          {index === 0 && (
                            <Badge variant="default" className="text-xs">
                              Responsável
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {franchisee.email}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {franchisee.contract_type || "Full"}
                          </Badge>
                          <Badge variant={status.variant} className="text-xs">
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/franqueados/${franchisee.id}`)}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Abrir
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
