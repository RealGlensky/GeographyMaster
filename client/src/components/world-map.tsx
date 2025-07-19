import { Country } from "@shared/schema";

interface WorldMapProps {
  countries: Country[];
  selectedCountry?: string | null;
  hoveredCountry?: string | null;
  targetCountry?: string | null;
  showResult?: boolean;
  isCorrect?: boolean;
  onCountryClick?: (countryCode: string) => void;
  onCountryHover?: (countryCode: string | null) => void;
}

// Simplified world map with recognizable country shapes and positions
const WORLD_MAP_COUNTRIES = [
  // North America
  { code: 'US', name: 'United States', path: 'M150,180 L280,170 L290,220 L275,250 L200,260 L160,240 Z', x: 200, y: 210 },
  { code: 'CA', name: 'Canada', path: 'M120,120 L320,110 L340,160 L290,170 L150,180 L140,150 Z', x: 230, y: 145 },
  { code: 'MX', name: 'Mexico', path: 'M160,240 L200,260 L190,290 L170,280 Z', x: 180, y: 265 },
  
  // South America
  { code: 'BR', name: 'Brazil', path: 'M250,320 L320,310 L340,400 L320,480 L280,470 L260,420 Z', x: 300, y: 395 },
  { code: 'AR', name: 'Argentina', path: 'M270,450 L300,440 L310,520 L285,530 Z', x: 290, y: 485 },
  { code: 'PE', name: 'Peru', path: 'M230,360 L260,350 L250,400 L235,390 Z', x: 245, y: 375 },
  { code: 'CL', name: 'Chile', path: 'M245,420 L255,415 L265,520 L250,525 Z', x: 255, y: 472 },
  
  // Europe
  { code: 'GB', name: 'United Kingdom', path: 'M420,160 L435,155 L440,175 L425,180 Z', x: 430, y: 168 },
  { code: 'FR', name: 'France', path: 'M430,180 L455,175 L460,200 L440,205 Z', x: 445, y: 190 },
  { code: 'DE', name: 'Germany', path: 'M460,160 L480,155 L485,180 L465,185 Z', x: 472, y: 170 },
  { code: 'ES', name: 'Spain', path: 'M420,200 L450,195 L455,220 L425,225 Z', x: 437, y: 210 },
  { code: 'IT', name: 'Italy', path: 'M470,190 L485,185 L490,220 L475,225 Z', x: 480, y: 205 },
  { code: 'NO', name: 'Norway', path: 'M470,120 L490,115 L495,150 L475,155 Z', x: 482, y: 135 },
  { code: 'SE', name: 'Sweden', path: 'M485,125 L500,120 L505,155 L490,160 Z', x: 495, y: 140 },
  { code: 'RU', name: 'Russia', path: 'M500,130 L650,120 L670,180 L520,190 Z', x: 585, y: 155 },
  
  // Africa
  { code: 'DZ', name: 'Algeria', path: 'M450,240 L490,235 L495,270 L455,275 Z', x: 472, y: 255 },
  { code: 'LY', name: 'Libya', path: 'M490,240 L520,235 L525,270 L495,275 Z', x: 510, y: 255 },
  { code: 'EG', name: 'Egypt', path: 'M520,240 L540,235 L545,275 L525,280 Z', x: 532, y: 255 },
  { code: 'NG', name: 'Nigeria', path: 'M460,290 L485,285 L490,310 L465,315 Z', x: 475, y: 300 },
  { code: 'KE', name: 'Kenya', path: 'M540,320 L560,315 L565,345 L545,350 Z', x: 552, y: 330 },
  { code: 'ZA', name: 'South Africa', path: 'M510,420 L550,415 L555,450 L515,455 Z', x: 532, y: 435 },
  
  // Asia
  { code: 'CN', name: 'China', path: 'M600,180 L680,170 L690,230 L610,240 Z', x: 645, y: 205 },
  { code: 'IN', name: 'India', path: 'M580,250 L630,245 L640,310 L590,315 Z', x: 615, y: 280 },
  { code: 'JP', name: 'Japan', path: 'M720,200 L740,195 L745,230 L725,235 Z', x: 732, y: 215 },
  { code: 'ID', name: 'Indonesia', path: 'M640,330 L700,325 L705,355 L645,360 Z', x: 672, y: 340 },
  { code: 'TH', name: 'Thailand', path: 'M620,300 L640,295 L645,320 L625,325 Z', x: 632, y: 310 },
  { code: 'MY', name: 'Malaysia', path: 'M630,320 L650,315 L655,340 L635,345 Z', x: 642, y: 330 },
  { code: 'PH', name: 'Philippines', path: 'M680,300 L700,295 L705,325 L685,330 Z', x: 692, y: 315 },
  { code: 'KR', name: 'South Korea', path: 'M700,190 L715,185 L720,205 L705,210 Z', x: 710, y: 198 },
  { code: 'TR', name: 'Turkey', path: 'M520,190 L560,185 L565,210 L525,215 Z', x: 542, y: 200 },
  { code: 'IR', name: 'Iran', path: 'M560,210 L590,205 L595,240 L565,245 Z', x: 577, y: 225 },
  { code: 'IQ', name: 'Iraq', path: 'M540,220 L565,215 L570,245 L545,250 Z', x: 555, y: 232 },
  { code: 'SA', name: 'Saudi Arabia', path: 'M540,250 L580,245 L585,290 L545,295 Z', x: 562, y: 270 },
  { code: 'AF', name: 'Afghanistan', path: 'M590,220 L620,215 L625,245 L595,250 Z', x: 610, y: 232 },
  { code: 'PK', name: 'Pakistan', path: 'M600,240 L625,235 L630,270 L605,275 Z', x: 617, y: 255 },
  
  // Oceania
  { code: 'AU', name: 'Australia', path: 'M650,400 L720,395 L730,450 L660,455 Z', x: 690, y: 425 },
  { code: 'NZ', name: 'New Zealand', path: 'M740,440 L755,435 L760,465 L745,470 Z', x: 750, y: 450 },
];

export function WorldMap({
  countries,
  selectedCountry,
  hoveredCountry,
  targetCountry,
  showResult,
  isCorrect,
  onCountryClick,
  onCountryHover
}: WorldMapProps) {
  
  // Filter map countries to only show those available in the current difficulty
  const availableMapCountries = WORLD_MAP_COUNTRIES.filter(mapCountry =>
    countries.some(country => country.code === mapCountry.code)
  );

  console.log('WorldMap rendering:', { 
    countriesLength: countries.length, 
    availableMapCountries: availableMapCountries.length,
    selectedCountry,
    targetCountry 
  });

  return (
    <div className="relative bg-gradient-to-b from-blue-100 to-blue-50 rounded-lg border-2 border-blue-200 min-h-[500px] overflow-hidden">
      <svg
        viewBox="0 0 800 600"
        className="w-full h-full"
        onMouseLeave={() => onCountryHover?.(null)}
      >
        {/* Ocean background */}
        <rect width="800" height="600" fill="#e0f2fe" />
        
        {/* Grid pattern for reference */}
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e5e7eb" strokeWidth="0.5" opacity="0.3"/>
          </pattern>
        </defs>
        <rect width="800" height="600" fill="url(#grid)" />
        
        {/* Debug: Show all available countries */}
        {availableMapCountries.length === 0 && (
          <text x="400" y="300" textAnchor="middle" fontSize="16" fill="#ef4444">
            No countries to display
          </text>
        )}
        
        {/* Country shapes */}
        {availableMapCountries.map((mapCountry) => {
          const isTarget = targetCountry === mapCountry.code;
          const isSelected = selectedCountry === mapCountry.code;
          const isHovered = hoveredCountry === mapCountry.code;
          
          let fillColor = "#d1d5db"; // default gray
          let strokeColor = "#9ca3af";
          let strokeWidth = 1;
          
          if (showResult && isTarget && isCorrect) {
            fillColor = "#10b981"; // correct - green
            strokeColor = "#059669";
            strokeWidth = 3;
          } else if (showResult && isSelected && !isCorrect) {
            fillColor = "#ef4444"; // incorrect - red
            strokeColor = "#dc2626";
            strokeWidth = 3;
          } else if (isSelected) {
            fillColor = "#3b82f6"; // selected - blue
            strokeColor = "#2563eb";
            strokeWidth = 2;
          } else if (isHovered) {
            fillColor = "#f3f4f6"; // hover - light gray
            strokeColor = "#6b7280";
            strokeWidth = 2;
          }
          
          return (
            <g key={mapCountry.code}>
              <path
                d={mapCountry.path}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                className="cursor-pointer hover:opacity-90 transition-all duration-200"
                onClick={() => onCountryClick?.(mapCountry.code)}
                onMouseEnter={() => onCountryHover?.(mapCountry.code)}
              />
              
              {/* Always show country names for debugging */}
              <text
                x={mapCountry.x}
                y={mapCountry.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10"
                fontWeight="normal"
                fill="#1f2937"
                className="pointer-events-none select-none"
                style={{ 
                  textShadow: '1px 1px 2px rgba(255,255,255,0.9)'
                }}
              >
                {mapCountry.name.length > 8 ? mapCountry.name.substring(0, 8) + '...' : mapCountry.name}
              </text>
              
              {/* Highlighted label on hover or selection */}
              {(isHovered || isSelected || (showResult && isTarget)) && (
                <text
                  x={mapCountry.x}
                  y={mapCountry.y - 15}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="12"
                  fontWeight="bold"
                  fill="#1f2937"
                  className="pointer-events-none select-none"
                  style={{ 
                    textShadow: '1px 1px 2px rgba(255,255,255,0.9)',
                    filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.2))'
                  }}
                >
                  {mapCountry.name}
                </text>
              )}
            </g>
          );
        })}
        
        {/* Ocean labels for context */}
        <text x="100" y="100" fontSize="14" fill="#0369a1" opacity="0.6" className="select-none">
          Atlantic Ocean
        </text>
        <text x="400" y="80" fontSize="14" fill="#0369a1" opacity="0.6" className="select-none">
          Arctic Ocean
        </text>
        <text x="650" y="380" fontSize="14" fill="#0369a1" opacity="0.6" className="select-none">
          Pacific Ocean
        </text>
        <text x="500" y="380" fontSize="14" fill="#0369a1" opacity="0.6" className="select-none">
          Indian Ocean
        </text>
        
        {/* Continent labels */}
        <text x="200" y="50" fontSize="16" fontWeight="bold" fill="#374151" opacity="0.7" className="select-none">
          North America
        </text>
        <text x="280" y="350" fontSize="16" fontWeight="bold" fill="#374151" opacity="0.7" className="select-none">
          South America
        </text>
        <text x="460" y="140" fontSize="16" fontWeight="bold" fill="#374151" opacity="0.7" className="select-none">
          Europe
        </text>
        <text x="500" y="320" fontSize="16" fontWeight="bold" fill="#374151" opacity="0.7" className="select-none">
          Africa
        </text>
        <text x="630" y="160" fontSize="16" fontWeight="bold" fill="#374151" opacity="0.7" className="select-none">
          Asia
        </text>
        <text x="690" y="480" fontSize="16" fontWeight="bold" fill="#374151" opacity="0.7" className="select-none">
          Oceania
        </text>
      </svg>
      
      {/* Map legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg p-3 shadow-lg border">
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-300 rounded border border-gray-400"></div>
            <span>Countries</span>
          </div>
          {!showResult && (
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-100 rounded border border-gray-500"></div>
              <span>Hover to see name</span>
            </div>
          )}
          {showResult && (
            <>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Correct</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Wrong</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}