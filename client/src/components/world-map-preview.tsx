import { useQuery } from "@tanstack/react-query";

interface WorldMapPreviewProps {
  className?: string;
}

// Simplified world map data for preview (key countries)
const PREVIEW_COUNTRIES = [
  // North America
  { code: 'US', name: 'United States', path: 'M150,100 L220,95 L230,130 L210,150 L170,155 L140,140 Z', x: 185, y: 125 },
  { code: 'CA', name: 'Canada', path: 'M120,70 L250,65 L260,95 L230,100 L150,105 L130,85 Z', x: 190, y: 85 },
  { code: 'MX', name: 'Mexico', path: 'M140,140 L170,155 L165,175 L150,170 Z', x: 157, y: 160 },
  
  // South America
  { code: 'BR', name: 'Brazil', path: 'M200,180 L250,175 L265,230 L250,280 L220,275 L205,240 Z', x: 235, y: 225 },
  { code: 'AR', name: 'Argentina', path: 'M215,265 L235,260 L245,310 L225,315 Z', x: 230, y: 285 },
  
  // Europe
  { code: 'GB', name: 'United Kingdom', path: 'M320,90 L330,88 L332,100 L322,102 Z', x: 326, y: 95 },
  { code: 'FR', name: 'France', path: 'M325,102 L340,100 L342,115 L327,117 Z', x: 334, y: 108 },
  { code: 'DE', name: 'Germany', path: 'M340,85 L350,83 L352,100 L342,102 Z', x: 346, y: 92 },
  { code: 'RU', name: 'Russia', path: 'M350,70 L450,65 L465,100 L360,105 Z', x: 405, y: 85 },
  
  // Africa
  { code: 'EG', name: 'Egypt', path: 'M360,130 L375,128 L377,145 L362,147 Z', x: 369, y: 137 },
  { code: 'NG', name: 'Nigeria', path: 'M340,160 L355,158 L357,175 L342,177 Z', x: 349, y: 167 },
  { code: 'ZA', name: 'South Africa', path: 'M350,240 L375,238 L378,260 L353,262 Z', x: 364, y: 250 },
  
  // Asia
  { code: 'CN', name: 'China', path: 'M430,100 L480,95 L490,130 L440,135 Z', x: 465, y: 115 },
  { code: 'IN', name: 'India', path: 'M410,140 L450,137 L455,175 L415,178 Z', x: 432, y: 157 },
  { code: 'JP', name: 'Japan', path: 'M520,110 L535,108 L537,125 L522,127 Z', x: 529, y: 117 },
  
  // Oceania
  { code: 'AU', name: 'Australia', path: 'M470,220 L520,218 L525,245 L475,247 Z', x: 497, y: 232 },
];

export function WorldMapPreview({ className = "" }: WorldMapPreviewProps) {
  const { data: userProgress } = useQuery({
    queryKey: ["/api/user/progress"],
  });

  // Calculate mastery status for each country
  const getCountryStatus = (countryCode: string) => {
    if (!userProgress) return 'not-started';
    
    const progress = userProgress.find((p: any) => p.countryCode === countryCode);
    if (!progress) return 'not-started';
    
    if (progress.masteryLevel >= 85 && progress.totalAttempts >= 3) return 'mastered';
    if (progress.totalAttempts > 0) return 'learning';
    return 'not-started';
  };

  const getCountryColor = (status: string) => {
    switch (status) {
      case 'mastered': return '#22c55e'; // Green
      case 'learning': return '#f59e0b'; // Orange
      default: return '#e5e7eb'; // Gray
    }
  };

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 600 320"
        className="w-full h-full"
        style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #dcfce7 100%)' }}
      >
        {/* Render countries */}
        {PREVIEW_COUNTRIES.map(country => {
          const status = getCountryStatus(country.code);
          const color = getCountryColor(status);
          
          return (
            <g key={country.code}>
              <path
                d={country.path}
                fill={color}
                stroke="#ffffff"
                strokeWidth="1"
                className="transition-all duration-200 hover:opacity-80"
              />
            </g>
          );
        })}
        
        {/* Legend */}
        <g className="legend">
          <rect x="10" y="10" width="140" height="70" fill="rgba(255,255,255,0.9)" rx="4" />
          
          {/* Mastered */}
          <circle cx="20" cy="25" r="4" fill="#22c55e" />
          <text x="30" y="30" fontSize="10" fill="#374151" fontFamily="system-ui">Mastered</text>
          
          {/* Learning */}
          <circle cx="20" cy="45" r="4" fill="#f59e0b" />
          <text x="30" y="50" fontSize="10" fill="#374151" fontFamily="system-ui">Learning</text>
          
          {/* Not Started */}
          <circle cx="20" cy="65" r="4" fill="#e5e7eb" />
          <text x="30" y="70" fontSize="10" fill="#374151" fontFamily="system-ui">Not Started</text>
        </g>
      </svg>
    </div>
  );
}