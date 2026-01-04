import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

// City coordinates for Brazil (simplified - in production would come from a geocoding service or database)
const cityCoordinates: Record<string, [number, number]> = {
  // São Paulo
  'São Paulo': [-46.6333, -23.5505],
  'Guarulhos': [-46.5333, -23.4628],
  'Campinas': [-47.0608, -22.9056],
  'São Bernardo do Campo': [-46.5650, -23.6944],
  'Santo André': [-46.5322, -23.6639],
  'Osasco': [-46.7917, -23.5325],
  'Ribeirão Preto': [-47.8103, -21.1775],
  'Santos': [-46.3331, -23.9608],
  'Sorocaba': [-47.4583, -23.5017],
  // Rio de Janeiro
  'Rio de Janeiro': [-43.1729, -22.9068],
  'Niterói': [-43.1036, -22.8808],
  'Nova Iguaçu': [-43.4508, -22.7556],
  'Duque de Caxias': [-43.3117, -22.7858],
  // Minas Gerais
  'Belo Horizonte': [-43.9378, -19.9167],
  'Uberlândia': [-48.2764, -18.9186],
  'Contagem': [-44.0539, -19.9317],
  'Juiz de Fora': [-43.3503, -21.7642],
  // Paraná
  'Curitiba': [-49.2731, -25.4284],
  'Londrina': [-51.1628, -23.3045],
  'Maringá': [-51.9386, -23.4253],
  // Rio Grande do Sul
  'Porto Alegre': [-51.2177, -30.0346],
  'Caxias do Sul': [-51.1789, -29.1634],
  // Santa Catarina
  'Florianópolis': [-48.5482, -27.5954],
  'Joinville': [-48.8461, -26.3044],
  // Bahia
  'Salvador': [-38.5016, -12.9711],
  'Feira de Santana': [-38.9663, -12.2669],
  // Goiás
  'Goiânia': [-49.2539, -16.6864],
  'Aparecida de Goiânia': [-49.2469, -16.8239],
  // Paraguay
  'Asunción': [-57.5759, -25.2637],
  'Ciudad del Este': [-54.6156, -25.5089],
};

interface ServiceArea {
  city_id: string;
  city: string;
  state: string;
  country: string;
}

interface FranchiseeWithCoverage {
  id: string;
  display_name: string;
  email: string;
  contract_type: string | null;
  service_areas: ServiceArea[];
  contract_expiration_date: string | null;
}

interface CityWithCoverage {
  city: string;
  state: string;
  country: string;
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
        // Try to get from Supabase Edge Function secrets
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (data?.token) {
          setMapboxToken(data.token);
        } else {
          // Fallback: check if token is in localStorage (for dev)
          const storedToken = localStorage.getItem('MAPBOX_PUBLIC_TOKEN');
          if (storedToken) {
            setMapboxToken(storedToken);
          }
        }
      } catch (err) {
        console.error('Error fetching Mapbox token:', err);
        // Try localStorage fallback
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
  const addMarkers = useCallback(() => {
    if (!map.current) return;

    clearMarkers();

    filteredCoverage.forEach((city) => {
      const coords = cityCoordinates[city.city];
      if (!coords) return;

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
    });
  }, [filteredCoverage, clearMarkers, onCityClick]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-55, -15], // Center of Brazil
      zoom: 3.5,
      minZoom: 2,
      maxZoom: 12,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: false }),
      'top-right'
    );

    // Add scale control
    map.current.addControl(
      new mapboxgl.ScaleControl({ maxWidth: 100 }),
      'bottom-left'
    );

    map.current.on('load', () => {
      addMarkers();
    });

    return () => {
      clearMarkers();
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Update markers when filters change
  useEffect(() => {
    if (map.current && map.current.loaded()) {
      addMarkers();
    }
  }, [addMarkers]);

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
