import { useEffect, useRef, useState, useMemo } from 'react';
import { Country } from "@shared/schema";
import { COUNTRY_COORDINATES } from "@shared/country-coordinates";

interface GoogleMapsWorldProps {
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
  markerVisibility = 'always',
  onCountryClick,
  onCountryHover
}: GoogleMapsWorldProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const markersRef = useRef<Map<string, any>>(new Map()); // Stable marker reference

  // Memoize available countries to prevent infinite re-renders
  const availableCountries = useMemo(() => {
    return countries.filter(country => COUNTRY_COORDINATES[country.code]);
  }, [countries]);

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

  // Initialize markers once and keep them stable
  useEffect(() => {
    if (!map || !window.google) return;

    // Create markers for all available countries once
    availableCountries.forEach(country => {
      const coordinates = COUNTRY_COORDINATES[country.code];
      if (!coordinates || markersRef.current.has(country.code)) return;

      const marker = new window.google.maps.Marker({
        position: { lat: coordinates.lat, lng: coordinates.lng },
        map: null, // Initially not on map
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#3b82f6',
          fillOpacity: 0.6,
          strokeWeight: 1,
          strokeColor: '#ffffff'
        },
        title: country.name,
        zIndex: 1000,
        clickable: true,
        optimized: false
      });

      // Store country code
      marker.countryCode = country.code;

      // Add event listeners
      marker.addListener('click', () => {
        onCountryClick?.(country.code);
      });

      marker.addListener('mouseover', () => {
        onCountryHover?.(country.code);
      });

      marker.addListener('mouseout', () => {
        onCountryHover?.(null);
      });

      markersRef.current.set(country.code, marker);
    });

    // Clean up markers for countries no longer available
    markersRef.current.forEach((marker, countryCode) => {
      if (!availableCountries.find(c => c.code === countryCode)) {
        marker.setMap(null);
        markersRef.current.delete(countryCode);
      }
    });

    setMarkers(Array.from(markersRef.current.values()));
  }, [map, availableCountries]);

  // Update marker visibility and styles without recreation
  useEffect(() => {
    markersRef.current.forEach((marker, countryCode) => {
      const country = availableCountries.find(c => c.code === countryCode);
      if (!country) return;

      const isTarget = targetCountry === countryCode;
      const isSelected = selectedCountry === countryCode;
      const isHovered = hoveredCountry === countryCode;

      // Always keep marker on map for click detection
      marker.setMap(map);
      
      // Determine visibility for styling (but keep marker always clickable)
      let shouldShowMarker = false;
      if (markerVisibility === 'always') {
        shouldShowMarker = true;
      } else if (markerVisibility === 'hover') {
        shouldShowMarker = isHovered || isSelected || (!!showResult && isTarget);
      } else if (markerVisibility === 'never') {
        shouldShowMarker = !!showResult && isTarget;
      }

      // Always update marker style (visible or invisible)
      let icon = {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#3b82f6',
        fillOpacity: shouldShowMarker ? 0.6 : 0, // Make invisible if not supposed to show
        strokeWeight: 1,
        strokeColor: '#ffffff',
        strokeOpacity: shouldShowMarker ? 1 : 0 // Make stroke invisible too
      };

      if (showResult && isTarget && isCorrect) {
        icon.fillColor = '#10b981';
        icon.strokeColor = '#ffffff';
        icon.scale = 12;
        icon.fillOpacity = 0.9;
        icon.strokeOpacity = 1;
        icon.strokeWeight = 2;
      } else if (showResult && isSelected && !isCorrect) {
        icon.fillColor = '#ef4444';
        icon.strokeColor = '#ffffff';
        icon.scale = 12;
        icon.fillOpacity = 0.9;
        icon.strokeOpacity = 1;
        icon.strokeWeight = 2;
      } else if (isSelected) {
        icon.fillColor = '#2563eb';
        icon.strokeColor = '#ffffff';
        icon.scale = 10;
        icon.fillOpacity = shouldShowMarker ? 0.8 : 0;
        icon.strokeOpacity = shouldShowMarker ? 1 : 0;
        icon.strokeWeight = 2;
      } else if (isHovered) {
        icon.fillColor = '#1d4ed8';
        icon.strokeColor = '#ffffff';
        icon.scale = 9;
        icon.fillOpacity = shouldShowMarker ? 0.7 : 0;
        icon.strokeOpacity = shouldShowMarker ? 1 : 0;
      }

      marker.setIcon(icon);
      marker.setZIndex(isSelected || isHovered || (showResult && isTarget) ? 2000 : 1000);
    });
  }, [map, markerVisibility, selectedCountry, hoveredCountry, targetCountry, showResult, isCorrect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current.clear();
    };
  }, []);

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