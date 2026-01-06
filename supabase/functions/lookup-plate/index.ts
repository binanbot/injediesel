import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Normalização de texto: capitalização correta
function normalizeText(text: string | null | undefined): string {
  if (!text) return "";
  
  // Remove espaços duplicados
  let normalized = text.replace(/\s+/g, " ").trim();
  
  // Capitalização correta (primeira letra maiúscula de cada palavra)
  normalized = normalized
    .toLowerCase()
    .split(" ")
    .map(word => {
      // Palavras pequenas que não devem ser capitalizadas (exceto no início)
      const lowercaseWords = ["de", "do", "da", "dos", "das", "e", "ou"];
      if (lowercaseWords.includes(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
  
  // Garantir primeira letra maiúscula
  normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  
  // Padronizações específicas de marcas
  const brandMappings: Record<string, string> = {
    "volvo do brasil": "Volvo",
    "volkswagen do brasil": "Volkswagen",
    "mercedes benz": "Mercedes-Benz",
    "mercedes-benz do brasil": "Mercedes-Benz",
    "fiat automóveis": "Fiat",
    "general motors": "Chevrolet",
    "gm": "Chevrolet",
    "bmw do brasil": "BMW",
    "toyota do brasil": "Toyota",
    "honda automóveis": "Honda",
    "hyundai motor": "Hyundai",
  };
  
  const lowerNormalized = normalized.toLowerCase();
  for (const [key, value] of Object.entries(brandMappings)) {
    if (lowerNormalized.includes(key)) {
      return value;
    }
  }
  
  return normalized;
}

// Interface para payload da API
interface PlateApiResponse {
  placa?: string;
  MARCA?: string;
  marca?: string;
  MODELO?: string;
  modelo?: string;
  anoModelo?: string;
  extra?: {
    placa_modelo_novo?: string;
    placa_modelo_antigo?: string;
    modelo?: string;
    ano_modelo?: string;
    motor?: string;
    cilindrada?: string;
    cambio?: string;
    transmissao?: string;
  };
}

// Extrai valor do primeiro campo disponível
function extractField(data: PlateApiResponse, ...paths: string[]): string {
  for (const path of paths) {
    const parts = path.split(".");
    let value: any = data;
    for (const part of parts) {
      value = value?.[part];
      if (value === undefined) break;
    }
    if (value !== undefined && value !== null && value !== "") {
      return String(value);
    }
  }
  return "";
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { plate, country = "BR" } = await req.json();

    if (!plate || plate.length < 7) {
      return new Response(
        JSON.stringify({ error: "Placa inválida", code: "INVALID_PLATE" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const placasApiToken = Deno.env.get("PLACAS_API_TOKEN");

    if (!placasApiToken) {
      return new Response(
        JSON.stringify({ error: "API de placas não configurada", code: "API_NOT_CONFIGURED" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Verificar cache (válido por 7 dias)
    const { data: cacheData } = await supabase
      .from("plate_lookup_cache")
      .select("payload, expires_at")
      .eq("plate", plate.toUpperCase())
      .eq("country", country)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cacheData?.payload) {
      console.log(`Cache hit para placa ${plate}`);
      return new Response(
        JSON.stringify({
          success: true,
          fromCache: true,
          data: cacheData.payload,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Consultar API externa
    console.log(`Consultando API para placa ${plate}`);
    
    const apiUrl = `https://api.apiplaca.com.br/consulta/${plate}`;
    
    const apiResponse = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${placasApiToken}`,
        "Content-Type": "application/json",
      },
    });

    // Placa não encontrada
    if (apiResponse.status === 406) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Placa não encontrada", 
          code: "PLATE_NOT_FOUND" 
        }),
        { status: 406, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!apiResponse.ok) {
      console.error(`API error: ${apiResponse.status}`);
      return new Response(
        JSON.stringify({ 
          error: "Erro ao consultar API de placas", 
          code: "API_ERROR",
          details: apiResponse.statusText 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawData: PlateApiResponse = await apiResponse.json();

    // 3. Mapear e normalizar campos conforme especificação
    const mappedData = {
      placa: extractField(rawData, "placa", "extra.placa_modelo_novo", "extra.placa_modelo_antigo") || plate.toUpperCase(),
      marca: normalizeText(extractField(rawData, "MARCA", "marca")),
      modelo: normalizeText(extractField(rawData, "MODELO", "modelo", "extra.modelo")),
      anoModelo: extractField(rawData, "anoModelo", "extra.ano_modelo"),
      motor: extractField(rawData, "extra.motor", "extra.cilindrada"),
      transmissao: normalizeText(extractField(rawData, "extra.cambio", "extra.transmissao")),
      // Payload bruto para auditoria
      rawPayload: rawData,
    };

    // 4. Salvar no cache
    try {
      await supabase
        .from("plate_lookup_cache")
        .upsert({
          plate: plate.toUpperCase(),
          country,
          payload: mappedData,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }, { onConflict: "plate,country" });
    } catch (cacheError) {
      console.error("Erro ao salvar cache:", cacheError);
      // Não falha a requisição por erro de cache
    }

    // 5. Verificar campos incompletos (P2)
    const incompleteFields: string[] = [];
    if (!mappedData.motor) incompleteFields.push("motor");
    if (!mappedData.transmissao) incompleteFields.push("transmissao");

    return new Response(
      JSON.stringify({
        success: true,
        fromCache: false,
        data: mappedData,
        incompleteFields: incompleteFields.length > 0 ? incompleteFields : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro na função lookup-plate:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido", 
        code: "INTERNAL_ERROR" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
