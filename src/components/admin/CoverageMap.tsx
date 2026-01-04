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
  // Paraná
  'Curitiba-PR': [-49.2731, -25.4284],
  'Londrina-PR': [-51.1628, -23.3045],
  'Maringá-PR': [-51.9386, -23.4253],
  'Cascavel-PR': [-53.4552, -24.9578],
  'Toledo-PR': [-53.7428, -24.7136],
  'Foz do Iguaçu-PR': [-54.5854, -25.5163],
  'Ponta Grossa-PR': [-50.1619, -25.0916],
  // Rio de Janeiro
  'Rio de Janeiro-RJ': [-43.1729, -22.9068],
  'Niterói-RJ': [-43.1036, -22.8808],
  'Nova Iguaçu-RJ': [-43.4508, -22.7556],
  'Duque de Caxias-RJ': [-43.3117, -22.7858],
  // Minas Gerais
  'Belo Horizonte-MG': [-43.9378, -19.9167],
  'Uberlândia-MG': [-48.2764, -18.9186],
  'Contagem-MG': [-44.0539, -19.9317],
  'Juiz de Fora-MG': [-43.3503, -21.7642],
  // Rio Grande do Sul
  'Porto Alegre-RS': [-51.2177, -30.0346],
  'Caxias do Sul-RS': [-51.1789, -29.1634],
  // Santa Catarina
  'Florianópolis-SC': [-48.5482, -27.5954],
  'Joinville-SC': [-48.8461, -26.3044],
  // Bahia
  'Salvador-BA': [-38.5016, -12.9711],
  'Feira de Santana-BA': [-38.9663, -12.2669],
  // Goiás
  'Goiânia-GO': [-49.2539, -16.6864],
  'Aparecida de Goiânia-GO': [-49.2469, -16.8239],
  // Maranhão
  'Balsas-MA': [-46.0356, -7.5328],
  // Paraguay
  'Asunción-AS': [-57.5759, -25.2637],
  'Ciudad del Este-AL': [-54.6156, -25.5089],
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
