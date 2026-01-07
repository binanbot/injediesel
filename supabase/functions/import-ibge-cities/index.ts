import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface IBGEMunicipio {
  id: number;
  nome: string;
  microrregiao?: {
    mesorregiao?: {
      UF?: {
        sigla: string;
      };
    };
  };
}

interface IBGEState {
  id: number;
  sigla: string;
  nome: string;
}

function normalizeSearchKey(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ========== AUTENTICAÇÃO E AUTORIZAÇÃO ==========
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se é admin/suporte
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "suporte"])
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ success: false, error: "Acesso não autorizado: requer admin" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // ========== FIM AUTENTICAÇÃO ==========

    console.log("Fetching states from IBGE API...");
    
    // Fetch all states first
    const statesResponse = await fetch(
      "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome"
    );
    
    if (!statesResponse.ok) {
      throw new Error(`IBGE States API error: ${statesResponse.status}`);
    }
    
    const states: IBGEState[] = await statesResponse.json();
    console.log(`Fetched ${states.length} states`);

    const allCities: { id: string; country: string; state: string; city: string; search_key: string }[] = [];

    // Fetch municipalities for each state
    for (const state of states) {
      console.log(`Fetching municipalities for ${state.sigla}...`);
      
      const municipiosResponse = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state.id}/municipios`
      );
      
      if (!municipiosResponse.ok) {
        console.error(`Error fetching ${state.sigla}: ${municipiosResponse.status}`);
        continue;
      }
      
      const municipios: { id: number; nome: string }[] = await municipiosResponse.json();
      
      for (const m of municipios) {
        allCities.push({
          id: `BR-${state.sigla}-${m.id}`,
          country: "BR",
          state: state.sigla,
          city: m.nome,
          search_key: normalizeSearchKey(m.nome),
        });
      }
    }

    console.log(`Total municipalities fetched: ${allCities.length}`);

    // Insert in batches of 500
    const batchSize = 500;
    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < allCities.length; i += batchSize) {
      const batch = allCities.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from("cities_reference")
        .upsert(batch, { onConflict: "id", ignoreDuplicates: false });
      
      if (error) {
        console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
        errors++;
      } else {
        inserted += batch.length;
        console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} cities`);
      }
    }

    // Also add Paraguayan cities
    const paraguayanCities = [
      { id: "PY-ASU-asuncion", country: "PY", state: "Central", city: "Asunción", search_key: "asuncion" },
      { id: "PY-CDE-ciudad-del-este", country: "PY", state: "Alto Paraná", city: "Ciudad del Este", search_key: "ciudad del este" },
      { id: "PY-ENC-encarnacion", country: "PY", state: "Itapúa", city: "Encarnación", search_key: "encarnacion" },
      { id: "PY-SLO-san-lorenzo", country: "PY", state: "Central", city: "San Lorenzo", search_key: "san lorenzo" },
      { id: "PY-LUQ-luque", country: "PY", state: "Central", city: "Luque", search_key: "luque" },
      { id: "PY-CAP-capiata", country: "PY", state: "Central", city: "Capiatá", search_key: "capiata" },
      { id: "PY-LAM-lambare", country: "PY", state: "Central", city: "Lambaré", search_key: "lambare" },
      { id: "PY-FLM-fernando-de-la-mora", country: "PY", state: "Central", city: "Fernando de la Mora", search_key: "fernando de la mora" },
      { id: "PY-PJC-pedro-juan-caballero", country: "PY", state: "Amambay", city: "Pedro Juan Caballero", search_key: "pedro juan caballero" },
      { id: "PY-COV-coronel-oviedo", country: "PY", state: "Caaguazú", city: "Coronel Oviedo", search_key: "coronel oviedo" },
      { id: "PY-VEN-villarrica", country: "PY", state: "Guairá", city: "Villarrica", search_key: "villarrica" },
      { id: "PY-ITA-ita", country: "PY", state: "Central", city: "Itá", search_key: "ita" },
      { id: "PY-CAA-caacupe", country: "PY", state: "Cordillera", city: "Caacupé", search_key: "caacupe" },
      { id: "PY-CON-concepcion", country: "PY", state: "Concepción", city: "Concepción", search_key: "concepcion" },
      { id: "PY-PIR-pilar", country: "PY", state: "Ñeembucú", city: "Pilar", search_key: "pilar" },
      { id: "PY-SJB-san-juan-bautista", country: "PY", state: "Misiones", city: "San Juan Bautista", search_key: "san juan bautista" },
      { id: "PY-CAG-caaguazu", country: "PY", state: "Caaguazú", city: "Caaguazú", search_key: "caaguazu" },
      { id: "PY-ITP-itaugua", country: "PY", state: "Central", city: "Itauguá", search_key: "itaugua" },
      { id: "PY-YPE-ypane", country: "PY", state: "Central", city: "Ypané", search_key: "ypane" },
      { id: "PY-MAR-mariano-roque-alonso", country: "PY", state: "Central", city: "Mariano Roque Alonso", search_key: "mariano roque alonso" },
    ];

    const { error: pyError } = await supabase
      .from("cities_reference")
      .upsert(paraguayanCities, { onConflict: "id", ignoreDuplicates: false });

    if (pyError) {
      console.error("Error inserting Paraguayan cities:", pyError);
    } else {
      inserted += paraguayanCities.length;
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_ibge: allCities.length,
        inserted,
        errors,
        message: `Successfully imported ${inserted} cities (${allCities.length} Brazilian + ${paraguayanCities.length} Paraguayan)`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
