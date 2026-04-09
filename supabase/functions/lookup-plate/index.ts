import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// --- Rate limiting (in-memory, per-user) ---
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 15; // requests per window
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

// --- Text normalization ---
function normalizeText(text: string | null | undefined): string {
  if (!text) return "";
  let normalized = text.replace(/\s+/g, " ").trim();
  normalized = normalized
    .toLowerCase()
    .split(" ")
    .map(word => {
      const lowercaseWords = ["de", "do", "da", "dos", "das", "e", "ou"];
      if (lowercaseWords.includes(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
  normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);

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
    if (lowerNormalized.includes(key)) return value;
  }
  return normalized;
}

// --- API response interface ---
interface PlateApiResponse {
  placa?: string;
  MARCA?: string;
  marca?: string;
  MODELO?: string;
  modelo?: string;
  ano?: string;
  anoModelo?: string;
  cor?: string;
  municipio?: string;
  uf?: string;
  extra?: {
    placa_modelo_novo?: string;
    placa_modelo_antigo?: string;
    modelo?: string;
    ano_modelo?: string;
    ano_fabricacao?: string;
    cilindradas?: string;
    caixa_cambio?: string;
    combustivel?: string;
    potencia?: string;
    tipo_veiculo?: string;
    especie?: string;
  };
  error?: boolean;
  message?: string;
}

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

// --- Allowed roles for plate lookup ---
const ALLOWED_ROLES = ["admin", "suporte", "admin_empresa", "suporte_empresa", "franqueado", "master_admin", "ceo"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validate JWT and extract user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Não autorizado", code: "UNAUTHORIZED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate token and get user claims
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: "Token inválido", code: "INVALID_TOKEN" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;

    // 2. Verify user role
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (!roleData || !ALLOWED_ROLES.includes(roleData.role)) {
      return new Response(
        JSON.stringify({ error: "Sem permissão para consultar placas", code: "FORBIDDEN" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Rate limiting
    if (!checkRateLimit(userId)) {
      return new Response(
        JSON.stringify({ error: "Limite de consultas atingido. Tente novamente em 1 minuto.", code: "RATE_LIMITED" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" } }
      );
    }

    // 4. Validate input
    const { plate, country = "BR" } = await req.json();

    if (!plate || typeof plate !== "string" || plate.length < 7 || plate.length > 10) {
      return new Response(
        JSON.stringify({ error: "Placa inválida", code: "INVALID_PLATE" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize plate: only allow alphanumeric and hyphens
    const sanitizedPlate = plate.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (sanitizedPlate.length < 7) {
      return new Response(
        JSON.stringify({ error: "Placa inválida", code: "INVALID_PLATE" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const placasApiToken = Deno.env.get("PLACAS_API_TOKEN");
    const placasApiUrl = Deno.env.get("PLACAS_API_URL");

    if (!placasApiToken || !placasApiUrl) {
      return new Response(
        JSON.stringify({ error: "API de placas não configurada", code: "API_NOT_CONFIGURED" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Check cache
    const { data: cacheData } = await serviceClient
      .from("plate_lookup_cache")
      .select("payload, expires_at")
      .eq("plate", sanitizedPlate)
      .eq("country", country)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cacheData?.payload) {
      console.log(`Cache hit for plate ${sanitizedPlate} by user ${userId}`);
      return new Response(
        JSON.stringify({ success: true, fromCache: true, data: cacheData.payload }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Query external API
    const apiUrl = `https://wdapi2.com.br/consulta/${sanitizedPlate}/${placasApiToken}`;
    console.log(`API lookup for plate ${sanitizedPlate} by user ${userId} (role: ${roleData.role})`);

    const apiResponse = await fetch(apiUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (apiResponse.status === 406) {
      return new Response(
        JSON.stringify({ success: false, error: "Placa não encontrada", code: "PLATE_NOT_FOUND" }),
        { status: 406, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!apiResponse.ok) {
      console.error(`API error: ${apiResponse.status}`);
      return new Response(
        JSON.stringify({ error: "Erro ao consultar API de placas", code: "API_ERROR" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawData: PlateApiResponse = await apiResponse.json();

    if (rawData.error) {
      console.error(`API returned error for plate ${sanitizedPlate}`);
      return new Response(
        JSON.stringify({ success: false, error: "Erro na consulta", code: "API_ERROR" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Map and normalize fields
    const cilindradas = extractField(rawData, "extra.cilindradas");
    const combustivel = extractField(rawData, "extra.combustivel");
    const motorInfo = cilindradas ? `${cilindradas}cc${combustivel ? ` - ${combustivel}` : ""}` : "";

    const mappedData = {
      placa: extractField(rawData, "placa", "extra.placa_modelo_novo", "extra.placa_modelo_antigo") || sanitizedPlate,
      marca: normalizeText(extractField(rawData, "MARCA", "marca")),
      modelo: normalizeText(extractField(rawData, "MODELO", "modelo", "extra.modelo")),
      anoModelo: extractField(rawData, "anoModelo", "ano", "extra.ano_modelo"),
      motor: motorInfo,
      transmissao: normalizeText(extractField(rawData, "extra.caixa_cambio")),
      cor: extractField(rawData, "cor"),
      municipio: extractField(rawData, "municipio", "extra.municipio"),
      uf: extractField(rawData, "uf", "extra.uf"),
      tipoVeiculo: extractField(rawData, "extra.tipo_veiculo", "extra.especie"),
      rawPayload: rawData,
    };

    // 8. Save to cache
    try {
      await serviceClient
        .from("plate_lookup_cache")
        .upsert({
          plate: sanitizedPlate,
          country,
          payload: mappedData,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }, { onConflict: "plate,country" });
    } catch (cacheError) {
      console.error("Cache save error:", cacheError);
    }

    // 9. Check incomplete fields
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
    console.error("lookup-plate error:", error instanceof Error ? error.message : "Unknown");
    return new Response(
      JSON.stringify({ error: "Erro interno", code: "INTERNAL_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
