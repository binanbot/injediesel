import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

// Extended city coordinates - will be geocoded dynamically if not found
const cityCoordinatesCache: Record<string, [number, number]> = {
  // São Paulo
  'São Paulo-SP': [-46.6333, -23.5505],
  'Guarulhos-SP': [-46.5333, -23.4628],
  'Campinas-SP': [-47.0608, -22.9056],
  'São Bernardo do Campo-SP': [-46.5650, -23.6944],
  'Santo André-SP': [-46.5322, -23.6639],
  'Osasco-SP': [-46.7917, -23.5325],
  'Ribeirão Preto-SP': [-47.8103, -21.1775],
  'Santos-SP': [-46.3331, -23.9608],
  'Sorocaba-SP': [-47.4583, -23.5017],
  'Assis-SP': [-50.4122, -22.6617],
  'São José dos Campos-SP': [-45.8869, -23.1791],
  'Jundiaí-SP': [-46.8842, -23.1863],
  'Piracicaba-SP': [-47.6476, -22.7255],
  'Bauru-SP': [-49.0606, -22.3246],
  'Franca-SP': [-47.4008, -20.5390],
  'São José do Rio Preto-SP': [-49.3758, -20.8113],
  'Mogi das Cruzes-SP': [-46.1894, -23.5224],
  'Diadema-SP': [-46.6228, -23.6844],
  'Carapicuíba-SP': [-46.8406, -23.5225],
  'Mauá-SP': [-46.4614, -23.6678],
  'Itaquaquecetuba-SP': [-46.3486, -23.4863],
  'Taboão da Serra-SP': [-46.7578, -23.6219],
  'Praia Grande-SP': [-46.4172, -24.0058],
  'São Vicente-SP': [-46.3881, -23.9631],
  'Barueri-SP': [-46.8758, -23.5106],
  'Guarujá-SP': [-46.2564, -23.9936],
  'Taubaté-SP': [-45.5556, -23.0258],
  'Limeira-SP': [-47.4017, -22.5647],
  'Suzano-SP': [-46.3108, -23.5425],
  'Americana-SP': [-47.3325, -22.7394],
  'Marília-SP': [-49.9456, -22.2139],
  'Presidente Prudente-SP': [-51.3889, -22.1256],
  'Araraquara-SP': [-48.1758, -21.7944],
  'Jacareí-SP': [-45.9658, -23.3050],
  'Cotia-SP': [-46.9186, -23.6036],
  // Paraná
  'Curitiba-PR': [-49.2731, -25.4284],
  'Londrina-PR': [-51.1628, -23.3045],
  'Maringá-PR': [-51.9386, -23.4253],
  'Cascavel-PR': [-53.4552, -24.9578],
  'Toledo-PR': [-53.7428, -24.7136],
  'Foz do Iguaçu-PR': [-54.5854, -25.5163],
  'Ponta Grossa-PR': [-50.1619, -25.0916],
  'São José dos Pinhais-PR': [-49.2064, -25.5311],
  'Colombo-PR': [-49.2244, -25.2917],
  'Guarapuava-PR': [-51.4614, -25.3906],
  'Paranaguá-PR': [-48.5100, -25.5200],
  'Araucária-PR': [-49.4103, -25.5928],
  'Campo Largo-PR': [-49.5286, -25.4594],
  'Umuarama-PR': [-53.3244, -23.7661],
  'Apucarana-PR': [-51.4608, -23.5508],
  'Pinhais-PR': [-49.1925, -25.4436],
  'Campo Mourão-PR': [-52.3839, -24.0458],
  'Francisco Beltrão-PR': [-53.0550, -26.0822],
  'Paranavaí-PR': [-52.4653, -23.0731],
  // Rio de Janeiro
  'Rio de Janeiro-RJ': [-43.1729, -22.9068],
  'Niterói-RJ': [-43.1036, -22.8808],
  'Nova Iguaçu-RJ': [-43.4508, -22.7556],
  'Duque de Caxias-RJ': [-43.3117, -22.7858],
  'São Gonçalo-RJ': [-43.0536, -22.8269],
  'Campos dos Goytacazes-RJ': [-41.3269, -21.7545],
  'Belford Roxo-RJ': [-43.3992, -22.7639],
  'Petrópolis-RJ': [-43.1789, -22.5050],
  'Volta Redonda-RJ': [-44.1042, -22.5231],
  'São João de Meriti-RJ': [-43.3728, -22.8058],
  'Macaé-RJ': [-41.7869, -22.3711],
  'Magé-RJ': [-43.0392, -22.6542],
  'Itaboraí-RJ': [-42.8603, -22.7444],
  'Cabo Frio-RJ': [-42.0286, -22.8789],
  'Nova Friburgo-RJ': [-42.5311, -22.2817],
  // Minas Gerais
  'Belo Horizonte-MG': [-43.9378, -19.9167],
  'Uberlândia-MG': [-48.2764, -18.9186],
  'Contagem-MG': [-44.0539, -19.9317],
  'Juiz de Fora-MG': [-43.3503, -21.7642],
  'Betim-MG': [-44.1983, -19.9678],
  'Montes Claros-MG': [-43.8617, -16.7350],
  'Ribeirão das Neves-MG': [-44.0869, -19.7669],
  'Uberaba-MG': [-47.9317, -19.7478],
  'Governador Valadares-MG': [-41.9500, -18.8511],
  'Ipatinga-MG': [-42.5369, -19.4686],
  'Sete Lagoas-MG': [-44.2467, -19.4658],
  'Divinópolis-MG': [-44.8842, -20.1389],
  'Santa Luzia-MG': [-43.8514, -19.7694],
  'Ibirité-MG': [-44.0586, -20.0222],
  'Poços de Caldas-MG': [-46.5617, -21.7878],
  'Patos de Minas-MG': [-46.5181, -18.5789],
  'Pouso Alegre-MG': [-45.9364, -22.2303],
  'Teófilo Otoni-MG': [-41.5058, -17.8578],
  'Varginha-MG': [-45.4303, -21.5511],
  // Rio Grande do Sul
  'Porto Alegre-RS': [-51.2177, -30.0346],
  'Caxias do Sul-RS': [-51.1789, -29.1634],
  'Canoas-RS': [-51.1839, -29.9178],
  'Pelotas-RS': [-52.3425, -31.7719],
  'Santa Maria-RS': [-53.8069, -29.6869],
  'Gravataí-RS': [-50.9919, -29.9444],
  'Viamão-RS': [-51.0856, -30.0811],
  'Novo Hamburgo-RS': [-51.1306, -29.6786],
  'São Leopoldo-RS': [-51.1469, -29.7603],
  'Rio Grande-RS': [-52.0986, -32.0350],
  'Alvorada-RS': [-51.0811, -29.9903],
  'Passo Fundo-RS': [-52.4064, -28.2628],
  'Sapucaia do Sul-RS': [-51.1456, -29.8286],
  'Uruguaiana-RS': [-57.0853, -29.7547],
  'Santa Cruz do Sul-RS': [-52.4258, -29.7175],
  'Cachoeirinha-RS': [-51.1008, -29.9506],
  'Bagé-RS': [-54.1069, -31.3289],
  'Bento Gonçalves-RS': [-51.5186, -29.1717],
  'Erechim-RS': [-52.2733, -27.6344],
  // Santa Catarina
  'Florianópolis-SC': [-48.5482, -27.5954],
  'Joinville-SC': [-48.8461, -26.3044],
  'Blumenau-SC': [-49.0661, -26.9194],
  'São José-SC': [-48.6358, -27.6136],
  'Criciúma-SC': [-49.3697, -28.6775],
  'Chapecó-SC': [-52.6186, -27.0964],
  'Itajaí-SC': [-48.6617, -26.9078],
  'Palhoça-SC': [-48.6681, -27.6456],
  'Lages-SC': [-50.3258, -27.8156],
  'Jaraguá do Sul-SC': [-49.0661, -26.4853],
  'Balneário Camboriú-SC': [-48.6353, -26.9906],
  'Brusque-SC': [-48.9181, -27.0978],
  'Tubarão-SC': [-49.0069, -28.4669],
  'Caçador-SC': [-51.0147, -26.7756],
  // Bahia
  'Salvador-BA': [-38.5016, -12.9711],
  'Feira de Santana-BA': [-38.9663, -12.2669],
  'Vitória da Conquista-BA': [-40.8394, -14.8619],
  'Camaçari-BA': [-38.3256, -12.6978],
  'Itabuna-BA': [-39.2803, -14.7856],
  'Juazeiro-BA': [-40.5003, -9.4131],
  'Lauro de Freitas-BA': [-38.3269, -12.8978],
  'Ilhéus-BA': [-39.0464, -14.7886],
  'Teixeira de Freitas-BA': [-39.7419, -17.5392],
  'Barreiras-BA': [-44.9900, -12.1528],
  'Alagoinhas-BA': [-38.4189, -12.1356],
  'Porto Seguro-BA': [-39.0644, -16.4497],
  'Simões Filho-BA': [-38.4033, -12.7853],
  // Goiás
  'Goiânia-GO': [-49.2539, -16.6864],
  'Aparecida de Goiânia-GO': [-49.2469, -16.8239],
  'Anápolis-GO': [-48.9528, -16.3281],
  'Rio Verde-GO': [-50.9306, -17.7928],
  'Luziânia-GO': [-47.9503, -16.2528],
  'Águas Lindas de Goiás-GO': [-48.2781, -15.7664],
  'Valparaíso de Goiás-GO': [-47.9806, -16.0678],
  'Trindade-GO': [-49.4886, -16.6517],
  'Formosa-GO': [-47.3344, -15.5397],
  'Novo Gama-GO': [-48.0406, -16.0589],
  'Senador Canedo-GO': [-49.0917, -16.7081],
  'Itumbiara-GO': [-49.2153, -18.4192],
  'Catalão-GO': [-47.9461, -18.1656],
  'Jataí-GO': [-51.7181, -17.8817],
  // Maranhão
  'Balsas-MA': [-46.0356, -7.5328],
  'São Luís-MA': [-44.3028, -2.5297],
  'Imperatriz-MA': [-47.4919, -5.5189],
  'São José de Ribamar-MA': [-44.0611, -2.5489],
  'Timon-MA': [-42.8358, -5.0942],
  'Caxias-MA': [-43.3561, -4.8589],
  'Codó-MA': [-43.8856, -4.4553],
  'Paço do Lumiar-MA': [-44.1022, -2.5136],
  'Açailândia-MA': [-46.9917, -4.9472],
  'Bacabal-MA': [-44.7786, -4.2253],
  // Ceará
  'Fortaleza-CE': [-38.5433, -3.7172],
  'Caucaia-CE': [-38.6531, -3.7361],
  'Juazeiro do Norte-CE': [-39.3153, -7.2139],
  'Maracanaú-CE': [-38.6253, -3.8761],
  'Sobral-CE': [-40.3469, -3.6886],
  'Crato-CE': [-39.4097, -7.2342],
  'Itapipoca-CE': [-39.5783, -3.4942],
  'Maranguape-CE': [-38.6831, -3.8914],
  'Iguatu-CE': [-39.2986, -6.3614],
  'Quixadá-CE': [-39.0147, -4.9703],
  // Pernambuco
  'Recife-PE': [-34.8811, -8.0476],
  'Jaboatão dos Guararapes-PE': [-35.0144, -8.1128],
  'Olinda-PE': [-34.8550, -8.0089],
  'Caruaru-PE': [-35.9761, -8.2839],
  'Petrolina-PE': [-40.5008, -9.3986],
  'Paulista-PE': [-34.8728, -7.9403],
  'Cabo de Santo Agostinho-PE': [-35.0286, -8.2836],
  'Camaragibe-PE': [-34.9792, -8.0214],
  'Garanhuns-PE': [-36.4928, -8.8906],
  'Vitória de Santo Antão-PE': [-35.2917, -8.1181],
  // Pará
  'Belém-PA': [-48.4902, -1.4558],
  'Ananindeua-PA': [-48.3722, -1.3658],
  'Santarém-PA': [-54.7083, -2.4422],
  'Marabá-PA': [-49.1178, -5.3686],
  'Parauapebas-PA': [-49.9031, -6.0678],
  'Castanhal-PA': [-47.9261, -1.2936],
  'Abaetetuba-PA': [-48.8822, -1.7178],
  'Cametá-PA': [-49.4950, -2.2442],
  'Marituba-PA': [-48.3433, -1.3619],
  'Bragança-PA': [-46.7658, -1.0536],
  // Amazonas
  'Manaus-AM': [-60.0261, -3.1019],
  'Parintins-AM': [-56.7356, -2.6286],
  'Itacoatiara-AM': [-58.4442, -3.1428],
  'Manacapuru-AM': [-60.6219, -3.2906],
  'Coari-AM': [-63.1406, -4.0850],
  'Tefé-AM': [-64.7106, -3.3542],
  // Distrito Federal
  'Brasília-DF': [-47.8825, -15.7942],
  // Mato Grosso
  'Cuiabá-MT': [-56.0978, -15.6014],
  'Várzea Grande-MT': [-56.1322, -15.6461],
  'Rondonópolis-MT': [-54.6356, -16.4703],
  'Sinop-MT': [-55.5039, -11.8642],
  'Tangará da Serra-MT': [-57.4986, -14.6228],
  'Cáceres-MT': [-57.6831, -16.0717],
  'Sorriso-MT': [-55.7111, -12.5428],
  'Lucas do Rio Verde-MT': [-55.9106, -13.0503],
  'Primavera do Leste-MT': [-54.2969, -15.5603],
  'Barra do Garças-MT': [-52.2564, -15.8906],
  // Mato Grosso do Sul
  'Campo Grande-MS': [-54.6469, -20.4697],
  'Dourados-MS': [-54.8056, -22.2211],
  'Três Lagoas-MS': [-51.6789, -20.7511],
  'Corumbá-MS': [-57.6531, -19.0092],
  'Ponta Porã-MS': [-55.7256, -22.5358],
  'Naviraí-MS': [-54.1994, -23.0658],
  'Nova Andradina-MS': [-53.3431, -22.2331],
  'Aquidauana-MS': [-55.7867, -20.4711],
  // Espírito Santo
  'Vitória-ES': [-40.3089, -20.3155],
  'Vila Velha-ES': [-40.2925, -20.3297],
  'Serra-ES': [-40.3078, -20.1283],
  'Cariacica-ES': [-40.4206, -20.2639],
  'Cachoeiro de Itapemirim-ES': [-41.1128, -20.8489],
  'Linhares-ES': [-40.0722, -19.3911],
  'Colatina-ES': [-40.6306, -19.5392],
  'Guarapari-ES': [-40.5006, -20.6553],
  'São Mateus-ES': [-39.8581, -18.7156],
  // Paraíba
  'João Pessoa-PB': [-34.8631, -7.1153],
  'Campina Grande-PB': [-35.8811, -7.2306],
  'Santa Rita-PB': [-34.9781, -7.1136],
  'Patos-PB': [-37.2753, -7.0244],
  'Bayeux-PB': [-34.9319, -7.1253],
  'Cabedelo-PB': [-34.8342, -6.9811],
  'Cajazeiras-PB': [-38.5556, -6.8900],
  'Guarabira-PB': [-35.4897, -6.8544],
  // Rio Grande do Norte
  'Natal-RN': [-35.2094, -5.7945],
  'Mossoró-RN': [-37.3442, -5.1878],
  'Parnamirim-RN': [-35.2628, -5.9156],
  'São Gonçalo do Amarante-RN': [-35.3286, -5.7903],
  'Macaíba-RN': [-35.3547, -5.8550],
  'Ceará-Mirim-RN': [-35.4250, -5.6353],
  'Caicó-RN': [-37.0978, -6.4586],
  'Açu-RN': [-36.9089, -5.5756],
  // Alagoas
  'Maceió-AL': [-35.7353, -9.6658],
  'Arapiraca-AL': [-36.6611, -9.7528],
  'Rio Largo-AL': [-35.8231, -9.4781],
  'Palmeira dos Índios-AL': [-36.6328, -9.4069],
  'União dos Palmares-AL': [-36.0322, -9.1631],
  // Sergipe
  'Aracaju-SE': [-37.0731, -10.9472],
  'Nossa Senhora do Socorro-SE': [-37.1256, -10.8556],
  'Lagarto-SE': [-37.6531, -10.9172],
  'Itabaiana-SE': [-37.4253, -10.6853],
  'São Cristóvão-SE': [-37.2056, -11.0136],
  // Piauí
  'Teresina-PI': [-42.8019, -5.0892],
  'Parnaíba-PI': [-41.7767, -2.9053],
  'Picos-PI': [-41.4669, -7.0769],
  'Piripiri-PI': [-41.7769, -4.2736],
  'Floriano-PI': [-43.0228, -6.7692],
  'Campo Maior-PI': [-42.1686, -4.8275],
  // Tocantins
  'Palmas-TO': [-48.3336, -10.2128],
  'Araguaína-TO': [-48.2069, -7.1911],
  'Gurupi-TO': [-49.0686, -11.7294],
  'Porto Nacional-TO': [-48.4178, -10.7083],
  // Rondônia
  'Porto Velho-RO': [-63.9006, -8.7619],
  'Ji-Paraná-RO': [-61.9517, -10.8853],
  'Ariquemes-RO': [-63.0411, -9.9133],
  'Vilhena-RO': [-60.1456, -12.7406],
  'Cacoal-RO': [-61.4472, -11.4386],
  // Acre
  'Rio Branco-AC': [-67.8103, -9.9756],
  'Cruzeiro do Sul-AC': [-72.6756, -7.6306],
  // Roraima
  'Boa Vista-RR': [-60.6758, 2.8236],
  // Amapá
  'Macapá-AP': [-51.0669, 0.0356],
  'Santana-AP': [-51.1722, -0.0583],
  // Paraguay
  'Asunción-AS': [-57.5759, -25.2637],
  'Ciudad del Este-AL': [-54.6156, -25.5089],
  'San Lorenzo-CE': [-57.5092, -25.3389],
  'Luque-CE': [-57.4875, -25.2703],
  'Capiatá-CE': [-57.4408, -25.3556],
  'Fernando de la Mora-CE': [-57.5247, -25.3286],
  'Lambaré-CE': [-57.6064, -25.3456],
  'Encarnación-IT': [-55.8678, -27.3306],
  'Pedro Juan Caballero-AM': [-55.7333, -22.5472],
};

// Geocode a city using Mapbox API
async function geocodeCity(cityName: string, state: string, country: string, token: string): Promise<[number, number] | null> {
  const cacheKey = `${cityName}-${state}`;
  if (cityCoordinatesCache[cacheKey]) {
    return cityCoordinatesCache[cacheKey];
  }

  try {
    const countryCode = country === 'BR' ? 'br' : 'py';
    const query = encodeURIComponent(`${cityName}, ${state}, ${country === 'BR' ? 'Brazil' : 'Paraguay'}`);
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?country=${countryCode}&types=place&access_token=${token}`
    );
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      cityCoordinatesCache[cacheKey] = [lng, lat];
      return [lng, lat];
    }
  } catch (error) {
    console.error(`Failed to geocode ${cityName}:`, error);
  }
  return null;
}

interface ServiceArea {
  city_id: string;
  city: string;
  state: string;
  country: string;
}

interface CityWithCoverage {
  city: string;
  state: string;
  country: string;
  coordinates?: [number, number];
  franchisees: {
    id: string;
    name: string;
    contractType: string;
    isExpired: boolean;
  }[];
  isExclusive: boolean;
}

interface CoverageMapProps {
  filterUf: string;
  filterTipo: string;
  filterUnidade: string;
  onCityClick: (city: CityWithCoverage) => void;
}

export default function CoverageMap({ filterUf, filterTipo, filterUnidade, onCityClick }: CoverageMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [coverageData, setCoverageData] = useState<CityWithCoverage[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);

  // Fetch Mapbox token from edge function or environment
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data } = await supabase.functions.invoke('get-mapbox-token');
        if (data?.token) {
          setMapboxToken(data.token);
        } else {
          const storedToken = localStorage.getItem('MAPBOX_PUBLIC_TOKEN');
          if (storedToken) {
            setMapboxToken(storedToken);
          }
        }
      } catch (err) {
        console.error('Error fetching Mapbox token:', err);
        const storedToken = localStorage.getItem('MAPBOX_PUBLIC_TOKEN');
        if (storedToken) {
          setMapboxToken(storedToken);
        }
      }
    };
    fetchToken();
  }, []);

  // Fetch coverage data from database
  useEffect(() => {
    const fetchCoverageData = async () => {
      setLoading(true);
      try {
        const { data: franchisees, error } = await supabase
          .from('profiles_franchisees')
          .select('id, display_name, email, contract_type, service_areas, contract_expiration_date');

        if (error) throw error;

        // Process coverage data
        const cityMap = new Map<string, CityWithCoverage>();
        const today = new Date();

        (franchisees || []).forEach((franchisee) => {
          const areas = Array.isArray(franchisee.service_areas) 
            ? (franchisee.service_areas as unknown as ServiceArea[]) 
            : [];
          const isExpired = franchisee.contract_expiration_date 
            ? new Date(franchisee.contract_expiration_date) < today 
            : false;

          areas.forEach((area) => {
            const key = `${area.city}-${area.state}-${area.country}`;
            
            if (!cityMap.has(key)) {
              cityMap.set(key, {
                city: area.city,
                state: area.state,
                country: area.country,
                franchisees: [],
                isExclusive: true,
              });
            }
            
            const cityData = cityMap.get(key)!;
            cityData.franchisees.push({
              id: franchisee.id,
              name: franchisee.display_name || franchisee.email,
              contractType: franchisee.contract_type || 'Full',
              isExpired,
            });
            
            // If more than one franchisee, it's shared coverage
            if (cityData.franchisees.length > 1) {
              cityData.isExclusive = false;
            }
          });
        });

        setCoverageData(Array.from(cityMap.values()));
      } catch (err) {
        console.error('Error fetching coverage data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCoverageData();
  }, []);

  // Filter coverage data based on filters
  const filteredCoverage = coverageData.filter((city) => {
    // Filter by UF
    if (filterUf && filterUf !== 'all' && city.state !== filterUf) {
      return false;
    }
    
    // Filter by tipo (contract type)
    if (filterTipo && filterTipo !== 'all') {
      const hasMatchingType = city.franchisees.some(
        (f) => f.contractType.toLowerCase() === filterTipo.toLowerCase()
      );
      if (!hasMatchingType) return false;
    }
    
    // Filter by unidade
    if (filterUnidade && filterUnidade !== 'all') {
      const hasMatchingUnit = city.franchisees.some((f) => f.id === filterUnidade);
      if (!hasMatchingUnit) return false;
    }
    
    return true;
  });

  // Clear markers
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }
  }, []);

  // Add markers to map
  const addMarkers = useCallback(async () => {
    if (!map.current || !mapboxToken) return;

    clearMarkers();

    for (const city of filteredCoverage) {
      // Try to get coordinates from cache or geocode
      const cacheKey = `${city.city}-${city.state}`;
      let coords = cityCoordinatesCache[cacheKey] || city.coordinates;
      
      if (!coords && mapboxToken) {
        coords = await geocodeCity(city.city, city.state, city.country, mapboxToken) || undefined;
      }
      
      if (!coords) continue;

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'coverage-marker';
      
      // Color based on exclusive/shared
      const activeUnits = city.franchisees.filter((f) => !f.isExpired);
      const isActive = activeUnits.length > 0;
      
      if (!isActive) {
        el.style.backgroundColor = 'rgba(156, 163, 175, 0.6)'; // Gray for inactive
        el.style.borderColor = 'rgba(156, 163, 175, 0.8)';
      } else if (city.isExclusive) {
        el.style.backgroundColor = 'rgba(229, 57, 53, 0.6)'; // Red for exclusive
        el.style.borderColor = 'rgba(229, 57, 53, 0.9)';
      } else {
        el.style.backgroundColor = 'rgba(251, 140, 0, 0.6)'; // Orange for shared
        el.style.borderColor = 'rgba(251, 140, 0, 0.9)';
      }
      
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid';
      el.style.cursor = 'pointer';
      el.style.transition = 'transform 0.2s, box-shadow 0.2s';
      
      // Hover effect
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.3)';
        el.style.boxShadow = '0 0 12px rgba(0,0,0,0.3)';
        
        // Show tooltip
        if (popupRef.current) popupRef.current.remove();
        
        popupRef.current = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 25,
        })
          .setLngLat(coords)
          .setHTML(`
            <div style="padding: 8px; font-family: system-ui;">
              <strong>${city.city}</strong>
              <br/>
              <span style="color: #666;">${city.state} - ${city.country}</span>
              <br/>
              <small style="color: ${city.isExclusive ? '#E53935' : '#FB8C00'};">
                ${city.isExclusive ? 'Exclusiva' : 'Compartilhada'} • ${activeUnits.length} unidade(s)
              </small>
            </div>
          `)
          .addTo(map.current!);
      });
      
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.boxShadow = 'none';
        if (popupRef.current) {
          popupRef.current.remove();
          popupRef.current = null;
        }
      });
      
      // Click to show details
      el.addEventListener('click', () => {
        onCityClick(city);
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat(coords)
        .addTo(map.current!);

      markersRef.current.push(marker);
    }
  }, [filteredCoverage, clearMarkers, onCityClick, mapboxToken]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // Prevent re-initialization if map already exists
    if (map.current) return;

    mapboxgl.accessToken = mapboxToken;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-55, -15], // Center of Brazil
      zoom: 3.5,
      minZoom: 2,
      maxZoom: 12,
    });

    map.current = mapInstance;

    // Add navigation controls
    mapInstance.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: false }),
      'top-right'
    );

    // Add scale control
    mapInstance.addControl(
      new mapboxgl.ScaleControl({ maxWidth: 100 }),
      'bottom-left'
    );

    mapInstance.on('load', () => {
      // Only add markers if component is still mounted
      if (map.current === mapInstance) {
        addMarkers();
      }
    });

    return () => {
      // Clean up markers first
      markersRef.current.forEach((marker) => {
        try {
          marker.remove();
        } catch (e) {
          // Ignore removal errors
        }
      });
      markersRef.current = [];
      
      if (popupRef.current) {
        try {
          popupRef.current.remove();
        } catch (e) {
          // Ignore removal errors
        }
        popupRef.current = null;
      }
      
      // Then remove the map
      if (map.current === mapInstance) {
        try {
          mapInstance.remove();
        } catch (e) {
          // Ignore removal errors
        }
        map.current = null;
      }
    };
  }, [mapboxToken]);

  // Update markers when filters change
  useEffect(() => {
    if (map.current && map.current.loaded()) {
      addMarkers();
    }
  }, [filteredCoverage, mapboxToken]);

  if (loading && !mapboxToken) {
    return (
      <div className="aspect-[4/3] bg-secondary/50 rounded-xl flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!mapboxToken) {
    return (
      <div className="aspect-[4/3] bg-secondary/50 rounded-xl flex flex-col items-center justify-center p-6 text-center">
        <p className="text-muted-foreground mb-4">
          Token do Mapbox não configurado. Configure o token nas configurações do backend.
        </p>
        <input
          type="text"
          placeholder="Cole seu token público do Mapbox"
          className="w-full max-w-md px-4 py-2 border rounded-lg mb-2"
          onBlur={(e) => {
            if (e.target.value) {
              localStorage.setItem('MAPBOX_PUBLIC_TOKEN', e.target.value);
              setMapboxToken(e.target.value);
            }
          }}
        />
        <p className="text-xs text-muted-foreground">
          Obtenha em <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">mapbox.com</a>
        </p>
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {loading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 text-sm shadow-lg">
        <p className="font-medium mb-2">Legenda</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'rgba(229, 57, 53, 0.6)', border: '2px solid rgba(229, 57, 53, 0.9)' }} />
            <span>Exclusiva</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'rgba(251, 140, 0, 0.6)', border: '2px solid rgba(251, 140, 0, 0.9)' }} />
            <span>Compartilhada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'rgba(156, 163, 175, 0.6)', border: '2px solid rgba(156, 163, 175, 0.9)' }} />
            <span>Inativa</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{filteredCoverage.length} cidades</p>
      </div>
    </div>
  );
}
