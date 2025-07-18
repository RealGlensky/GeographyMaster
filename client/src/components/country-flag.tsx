interface CountryFlagProps {
  countryCode: string;
  countryName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-6 h-4",
  md: "w-8 h-6",
  lg: "w-12 h-8"
};

export function CountryFlag({ countryCode, countryName, size = "md", className = "" }: CountryFlagProps) {
  const flagUrl = `https://flagcdn.com/${countryCode.toLowerCase()}.svg`;
  
  return (
    <img
      src={flagUrl}
      alt={`${countryName} flag`}
      className={`${sizeClasses[size]} object-cover rounded-sm border border-gray-200 shadow-sm ${className}`}
      onError={(e) => {
        // Fallback to a placeholder if flag fails to load
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
      }}
    />
  );
}