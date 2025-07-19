import { useEffect, useRef, useState } from 'react';
import { Country } from "@shared/schema";
import { COUNTRY_COORDINATES } from "@shared/country-coordinates";

interface LeafletWorldMapProps {
  countries: Country[];
  selectedCountry?: string | null;
  hoveredCountry?: string | null;
  targetCountry?: string | null;
  showResult?: boolean;
  isCorrect?: boolean;
  markerVisibility?: 'always' | 'hover' | 'never';
  onCountryClick?: (countryCode: string) => void;
  onCountryHover?: (countryCode: string | null) => void;
}

declare global {
  interface Window {
    L: any;
  }
}

export function LeafletWorldMap({
  countries,
  selectedCountry,
  hoveredCountry,
  targetCountry,
  showResult,
  isCorrect,
  markerVisibility = 'always',
  onCountryClick,
  onCountryHover
}: LeafletWorldMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Filter available countries
  const availableCountries = countries.filter(country => 
    COUNTRY_COORDINATES[country.code]
  );

  // Load Leaflet
  useEffect(() => {
    if (window.L) {
      setIsLoaded(true);
      return;
    }

    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Load JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      setIsLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      if (link.parentNode) link.parentNode.removeChild(link);
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.L || map) return;

    const leafletMap = window.L.map(mapRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      dragging: true
    });

    // Add tile layer with custom styling
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      className: 'map-tiles'
    }).addTo(leafletMap);

    setMap(leafletMap);

    return () => {
      leafletMap.remove();
    };
  }, [isLoaded]);

  // Update markers with debouncing
  useEffect(() => {
    if (!map || !window.L) return;

    // Debounce to reduce jumpiness
    const timeoutId = setTimeout(() => {
      // Clear existing markers
      markers.forEach(marker => map.removeLayer(marker));

      const newMarkers = availableCountries.map(country => {
      const coordinates = COUNTRY_COORDINATES[country.code];
      if (!coordinates) return null;

      const isTarget = targetCountry === country.code;
      const isSelected = selectedCountry === country.code;
      const isHovered = hoveredCountry === country.code;

      // Determine if marker should be visible based on visibility setting
      let shouldShowMarker = false;
      if (markerVisibility === 'always') {
        shouldShowMarker = true;
      } else if (markerVisibility === 'hover') {
        shouldShowMarker = isHovered || isSelected || (showResult && isTarget);
      } else if (markerVisibility === 'never') {
        shouldShowMarker = showResult && isTarget; // Only show when revealing answer
      }

      if (!shouldShowMarker) {
        return null; // Don't create marker
      }

      let color = '#3b82f6';
      let size = 6;
      let opacity = 0.6;

      if (showResult && isTarget && isCorrect) {
        color = '#10b981';
        size = 10;
        opacity = 0.9;
      } else if (showResult && isSelected && !isCorrect) {
        color = '#ef4444';
        size = 10;
        opacity = 0.9;
      } else if (isSelected) {
        color = '#2563eb';
        size = 8;
        opacity = 0.8;
      } else if (isHovered) {
        color = '#1d4ed8';
        size = 7;
        opacity = 0.7;
      }

      const marker = window.L.circleMarker([coordinates.lat, coordinates.lng], {
        radius: size,
        fillColor: color,
        fillOpacity: opacity,
        color: '#ffffff',
        weight: 1,
        opacity: 1
      }).addTo(map);

      // Add click listener
      marker.on('click', () => {
        onCountryClick?.(country.code);
      });

      // Add hover listeners
      marker.on('mouseover', () => {
        onCountryHover?.(country.code);
      });

      marker.on('mouseout', () => {
        onCountryHover?.(null);
      });

      // Add tooltip
      marker.bindTooltip(country.name, {
        permanent: false,
        direction: 'top',
        offset: [0, -10]
      });

      return marker;
    }).filter(Boolean);

      setMarkers(newMarkers);
    }, 100); // 100ms debounce

    return () => clearTimeout(timeoutId);
  }, [map, availableCountries, selectedCountry, hoveredCountry, targetCountry, showResult, isCorrect, markerVisibility]);

  if (!isLoaded) {
    return (
      <div className="relative bg-gradient-to-b from-blue-100 to-blue-50 rounded-lg border-2 border-blue-200 min-h-[500px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading world map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg border-2 border-blue-200 min-h-[500px] overflow-hidden">
      <div ref={mapRef} className="w-full h-[500px]" />
      
      {/* Custom UI Overlay */}
      <div className="absolute top-4 left-4 bg-white rounded-lg p-3 shadow-lg border z-[1000]">
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <span>Countries</span>
          </div>
          {showResult && (
            <>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Correct</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Incorrect</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Country info overlay */}
      {hoveredCountry && !showResult && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg p-3 shadow-lg border z-[1000]">
          <p className="text-sm font-medium text-gray-900">
            {COUNTRY_COORDINATES[hoveredCountry]?.name || hoveredCountry}
          </p>
        </div>
      )}
    </div>
  );
}