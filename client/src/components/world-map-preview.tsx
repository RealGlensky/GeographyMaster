import { useQuery } from "@tanstack/react-query";
import { useRef, useEffect, useState, useMemo } from "react";

interface WorldMapPreviewProps {
  className?: string;
}

// Country coordinates for markers (subset for preview)
const COUNTRY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'US': { lat: 39.8283, lng: -98.5795 },
  'CA': { lat: 56.1304, lng: -106.3468 },
  'MX': { lat: 23.6345, lng: -102.5528 },
  'BR': { lat: -14.2350, lng: -51.9253 },
  'AR': { lat: -38.4161, lng: -63.6167 },
  'GB': { lat: 55.3781, lng: -3.4360 },
  'FR': { lat: 46.6034, lng: 1.8883 },
  'DE': { lat: 51.1657, lng: 10.4515 },
  'RU': { lat: 61.5240, lng: 105.3188 },
  'EG': { lat: 26.0975, lng: 31.2357 },
  'NG': { lat: 9.0820, lng: 8.6753 },
  'ZA': { lat: -30.5595, lng: 22.9375 },
  'CN': { lat: 35.8617, lng: 104.1954 },
  'IN': { lat: 20.5937, lng: 78.9629 },
  'JP': { lat: 36.2048, lng: 138.2529 },
  'AU': { lat: -25.2744, lng: 133.7751 },
  'IT': { lat: 41.8719, lng: 12.5674 },
  'ES': { lat: 40.4637, lng: -3.7492 },
  'TR': { lat: 38.9637, lng: 35.2433 },
  'IR': { lat: 32.4279, lng: 53.6880 },
  // Add countries that user has actually practiced
  'SD': { lat: 12.8628, lng: 30.2176 }, // Sudan
  'BT': { lat: 27.5142, lng: 90.4336 }, // Bhutan
};

export function WorldMapPreview({ className = "" }: WorldMapPreviewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [markers, setMarkers] = useState<any[]>([]);

  const { data: userProgress } = useQuery({
    queryKey: ["/api/user/progress"],
  });

  // Calculate mastery status for each country
  const getCountryStatus = (countryCode: string) => {
    if (!userProgress || !Array.isArray(userProgress)) return 'not-started';
    
    const progress = userProgress.find((p: any) => p.countryCode === countryCode);
    if (!progress) return 'not-started';
    

    
    // Use the same criteria as the backend for mastery
    if (progress.masteryLevel >= 85 && progress.totalAttempts >= 3) return 'mastered';
    if (progress.totalAttempts > 0) return 'learning';
    return 'not-started';
  };

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'mastered': return '#22c55e'; // Green
      case 'learning': return '#f59e0b'; // Orange
      default: return '#e5e7eb'; // Gray
    }
  };

  // Load Google Maps script
  useEffect(() => {
    if (window.google) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=geometry,places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setIsLoaded(true);
    };
    
    script.onerror = () => {
      console.error('Failed to load Google Maps API');
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
    if (!isLoaded || !mapRef.current || !window.google || map) return;

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
      gestureHandling: 'none',
      zoomControl: false,
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false
    });

    setMap(googleMap);
  }, [isLoaded, map]);

  // Add markers for countries with progress
  useEffect(() => {
    if (!map || !window.google) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));



    const newMarkers = Object.entries(COUNTRY_COORDINATES).map(([countryCode, coords]) => {
      const status = getCountryStatus(countryCode);
      const color = getMarkerColor(status);
      
      // Find the actual progress data for this country
      const progressData = userProgress?.find((p: any) => p.countryCode === countryCode);
      
      // Create more detailed title with actual data
      let title = `${countryCode} - ${status.replace('-', ' ')}`;
      if (progressData) {
        title += ` (Mastery: ${progressData.masteryLevel || 0}, Attempts: ${progressData.totalAttempts || 0})`;
      }

      // Create a custom marker
      const marker = new window.google.maps.Marker({
        position: coords,
        map: map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 0.8,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: status === 'not-started' ? 4 : status === 'mastered' ? 8 : 6,
        },
        title: title,
      });

      return marker;
    });

    setMarkers(newMarkers);
  }, [map, userProgress, getCountryStatus, getMarkerColor]);

  if (!isLoaded) {
    return (
      <div className={`relative ${className} bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading Map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {/* Legend overlay */}
      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-700">Mastered</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-xs text-gray-700">Learning</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            <span className="text-xs text-gray-700">Not Started</span>
          </div>
        </div>
      </div>
    </div>
  );
}