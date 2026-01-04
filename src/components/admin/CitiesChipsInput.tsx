import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { X, Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ServiceArea {
  country: string;
  state: string;
  city: string;
  city_id: string;
}

interface CityReference {
  id: string;
  country: string;
  state: string;
  city: string;
  search_key: string;
}

interface CitiesChipsInputProps {
  value: ServiceArea[];
  onChange: (areas: ServiceArea[]) => void;
  disabled?: boolean;
}

const normalizeSearchKey = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

export function CitiesChipsInput({ value, onChange, disabled }: CitiesChipsInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<CityReference[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

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
        .limit(20);

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

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchCities(newValue);
    }, 300);
  };

  const addCity = (city: CityReference) => {
    const isDuplicate = value.some((area) => area.city_id === city.id);
    if (isDuplicate) {
      toast.error("Cidade já adicionada");
      return;
    }

    const newArea: ServiceArea = {
      country: city.country,
      state: city.state,
      city: city.city,
      city_id: city.id,
    };

    onChange([...value, newArea]);
    setInputValue("");
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeCity = (cityId: string) => {
    onChange(value.filter((area) => area.city_id !== cityId));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
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
      addCity(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    } else if (e.key === "," || e.key === "Enter") {
      // Try to add city from input if exact match exists
      if (inputValue.trim() && suggestions.length === 1) {
        e.preventDefault();
        addCity(suggestions[0]);
      } else if (inputValue.trim() && e.key === ",") {
        e.preventDefault();
        // Check if there's an exact match
        const searchKey = normalizeSearchKey(inputValue.trim());
        const exactMatch = suggestions.find(
          (s) => s.search_key === searchKey
        );
        if (exactMatch) {
          addCity(exactMatch);
        } else {
          toast.error("Cidade não encontrada na base de referência");
        }
      }
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData("text");
    if (pastedText.includes(",")) {
      e.preventDefault();
      const cities = pastedText.split(",").map((c) => c.trim()).filter(Boolean);
      
      for (const cityName of cities) {
        const searchKey = normalizeSearchKey(cityName);
        const { data } = await supabase
          .from("cities_reference")
          .select("*")
          .eq("search_key", searchKey)
          .limit(1)
          .maybeSingle();

        if (data) {
          const isDuplicate = value.some((area) => area.city_id === data.id);
          if (!isDuplicate) {
            const newArea: ServiceArea = {
              country: data.country,
              state: data.state,
              city: data.city,
              city_id: data.id,
            };
            onChange([...value, newArea]);
          }
        } else {
          toast.error(`Cidade não encontrada: ${cityName}`);
        }
      }
      setInputValue("");
    }
  };

  const formatCityLabel = (area: ServiceArea) => {
    const countryLabel = area.country === "BR" ? "BR" : "PY";
    return `${area.city} - ${area.state} (${countryLabel})`;
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 min-h-[42px] p-2 border rounded-md bg-background">
        {value.map((area) => (
          <Badge
            key={area.city_id}
            variant="secondary"
            className="flex items-center gap-1 text-sm py-1 px-2"
          >
            <MapPin className="h-3 w-3" />
            {formatCityLabel(area)}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeCity(area.city_id)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        {!disabled && (
          <div className="relative flex-1 min-w-[200px]">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onFocus={() => inputValue.length >= 2 && setShowSuggestions(true)}
              placeholder="Digite a cidade e pressione vírgula..."
              className="border-0 shadow-none focus-visible:ring-0 px-0"
              disabled={disabled}
            />
            {isLoading && (
              <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full max-w-md mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {suggestions.map((city, index) => (
            <button
              key={city.id}
              type="button"
              onClick={() => addCity(city)}
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

      <p className="text-xs text-muted-foreground">
        Digite a cidade e pressione vírgula (,) ou Enter para adicionar. Você também pode colar uma lista separada por vírgulas.
      </p>
    </div>
  );
}
