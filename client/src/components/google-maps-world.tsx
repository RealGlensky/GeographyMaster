import { useEffect, useRef, useState } from 'react';
import { Country } from "@shared/schema";

interface GoogleMapsWorldProps {
  countries: Country[];
  selectedCountry?: string | null;
  hoveredCountry?: string | null;
  targetCountry?: string | null;
  showResult?: boolean;
  isCorrect?: boolean;
  onCountryClick?: (countryCode: string) => void;
  onCountryHover?: (countryCode: string | null) => void;
}

// Country coordinates for Google Maps
const COUNTRY_COORDINATES: Record<string, { lat: number; lng: number; name: string }> = {
  'US': { lat: 39.8283, lng: -98.5795, name: 'United States' },
  'CA': { lat: 56.1304, lng: -106.3468, name: 'Canada' },
  'MX': { lat: 23.6345, lng: -102.5528, name: 'Mexico' },
  'BR': { lat: -14.2350, lng: -51.9253, name: 'Brazil' },
  'AR': { lat: -38.4161, lng: -63.6167, name: 'Argentina' },
  'PE': { lat: -9.1900, lng: -75.0152, name: 'Peru' },
  'CL': { lat: -35.6751, lng: -71.5430, name: 'Chile' },
  'GB': { lat: 55.3781, lng: -3.4360, name: 'United Kingdom' },
  'FR': { lat: 46.6034, lng: 1.8883, name: 'France' },
  'DE': { lat: 51.1657, lng: 10.4515, name: 'Germany' },
  'ES': { lat: 40.4637, lng: -3.7492, name: 'Spain' },
  'IT': { lat: 41.8719, lng: 12.5674, name: 'Italy' },
  'NO': { lat: 60.4720, lng: 8.4689, name: 'Norway' },
  'SE': { lat: 60.1282, lng: 18.6435, name: 'Sweden' },
  'RU': { lat: 61.5240, lng: 105.3188, name: 'Russia' },
  'DZ': { lat: 28.0339, lng: 1.6596, name: 'Algeria' },
  'LY': { lat: 26.3351, lng: 17.2283, name: 'Libya' },
  'EG': { lat: 26.8206, lng: 30.8025, name: 'Egypt' },
  'NG': { lat: 9.0820, lng: 8.6753, name: 'Nigeria' },
  'KE': { lat: -0.0236, lng: 37.9062, name: 'Kenya' },
  'ZA': { lat: -30.5595, lng: 22.9375, name: 'South Africa' },
  'CN': { lat: 35.8617, lng: 104.1954, name: 'China' },
  'IN': { lat: 20.5937, lng: 78.9629, name: 'India' },
  'JP': { lat: 36.2048, lng: 138.2529, name: 'Japan' },
  'ID': { lat: -0.7893, lng: 113.9213, name: 'Indonesia' },
  'TH': { lat: 15.8700, lng: 100.9925, name: 'Thailand' },
  'MY': { lat: 4.2105, lng: 101.9758, name: 'Malaysia' },
  'PH': { lat: 12.8797, lng: 121.7740, name: 'Philippines' },
  'KR': { lat: 35.9078, lng: 127.7669, name: 'South Korea' },
  'TR': { lat: 38.9637, lng: 35.2433, name: 'Turkey' },
  'IR': { lat: 32.4279, lng: 53.6880, name: 'Iran' },
  'AU': { lat: -25.2744, lng: 133.7751, name: 'Australia' },
  'NZ': { lat: -40.9006, lng: 174.8860, name: 'New Zealand' },
};

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

export function GoogleMapsWorld({
  countries,
  selectedCountry,
  hoveredCountry,
  targetCountry,
  showResult,
  isCorrect,
  onCountryClick,
  onCountryHover
}: GoogleMapsWorldProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Filter available countries
  const availableCountries = countries.filter(country => 
    COUNTRY_COORDINATES[country.code]
  );

  // Load Google Maps script
  useEffect(() => {
    if (window.google) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg'}&libraries=geometry,places`;
    script.async = true;
    script.defer = true;
    
    window.initGoogleMaps = () => {
      setIsLoaded(true);
    };
    
    script.onload = () => {
      setIsLoaded(true);
    };
    
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.google) return;

    const googleMap = new window.google.maps.Map(mapRef.current, {
      zoom: 2,
      center: { lat: 20, lng: 0 },
      styles: [
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#e0f2fe' }]
        },
        {
          featureType: 'landscape',
          elementType: 'geometry',
          stylers: [{ color: '#f8fafc' }]
        },
        {
          featureType: 'road',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'poi',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'transit',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'administrative.locality',
          stylers: [{ visibility: 'off' }]
        }
      ],
      disableDefaultUI: true,
      gestureHandling: 'cooperative',
      zoomControl: true,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_BOTTOM
      }
    });

    setMap(googleMap);
  }, [isLoaded]);

  // Update markers with debouncing to reduce jumpiness
  useEffect(() => {
    if (!map || !window.google) return;

    // Debounce marker updates to prevent rapid re-rendering
    const timeoutId = setTimeout(() => {
      // Clear existing markers
      markers.forEach(marker => marker.setMap(null));

      const newMarkers = availableCountries.map(country => {
      const coordinates = COUNTRY_COORDINATES[country.code];
      if (!coordinates) return null;

      const isTarget = targetCountry === country.code;
      const isSelected = selectedCountry === country.code;
      const isHovered = hoveredCountry === country.code;

      let icon = {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#3b82f6',
        fillOpacity: 0.6,
        strokeWeight: 1,
        strokeColor: '#ffffff'
      };

      if (showResult && isTarget && isCorrect) {
        icon.fillColor = '#10b981';
        icon.strokeColor = '#ffffff';
        icon.scale = 12;
        icon.fillOpacity = 0.9;
        icon.strokeWeight = 2;
      } else if (showResult && isSelected && !isCorrect) {
        icon.fillColor = '#ef4444';
        icon.strokeColor = '#ffffff';
        icon.scale = 12;
        icon.fillOpacity = 0.9;
        icon.strokeWeight = 2;
      } else if (isSelected) {
        icon.fillColor = '#2563eb';
        icon.strokeColor = '#ffffff';
        icon.scale = 10;
        icon.fillOpacity = 0.8;
        icon.strokeWeight = 2;
      } else if (isHovered) {
        icon.fillColor = '#1d4ed8';
        icon.strokeColor = '#ffffff';
        icon.scale = 9;
        icon.fillOpacity = 0.7;
      }

      const marker = new window.google.maps.Marker({
        position: { lat: coordinates.lat, lng: coordinates.lng },
        map: map,
        icon: icon,
        title: country.name,
        zIndex: isSelected || isHovered || (showResult && isTarget) ? 1000 : 1
      });

      // Add click listener
      marker.addListener('click', () => {
        onCountryClick?.(country.code);
      });

      // Add hover listeners
      marker.addListener('mouseover', () => {
        onCountryHover?.(country.code);
      });

      marker.addListener('mouseout', () => {
        onCountryHover?.(null);
      });

      return marker;
    }).filter(Boolean);

      setMarkers(newMarkers);
    }, 100); // 100ms debounce

    return () => clearTimeout(timeoutId);
  }, [map, availableCountries, selectedCountry, hoveredCountry, targetCountry, showResult, isCorrect]);

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
      <div className="absolute top-4 left-4 bg-white rounded-lg p-3 shadow-lg border">
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
        <div className="absolute bottom-4 left-4 bg-white rounded-lg p-3 shadow-lg border">
          <p className="text-sm font-medium text-gray-900">
            {COUNTRY_COORDINATES[hoveredCountry]?.name || hoveredCountry}
          </p>
        </div>
      )}
    </div>
  );
}