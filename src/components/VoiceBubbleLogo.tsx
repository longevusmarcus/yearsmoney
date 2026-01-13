interface VoiceBubbleLogoProps {
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

const VoiceBubbleLogo = ({ size = "md", animated = true }: VoiceBubbleLogoProps) => {
  const sizeClasses = {
    sm: "w-20 h-20",
    md: "w-32 h-32",
    lg: "w-56 h-56"
  };

  const glowSizes = {
    sm: { outer: "w-32 h-32 -left-6 -top-6", inner: "w-28 h-28 -left-4 -top-4" },
    md: { outer: "w-48 h-48 -left-8 -top-8", inner: "w-44 h-44 -left-6 -top-6" },
    lg: { outer: "w-64 h-64 -left-4 -top-4", inner: "w-60 h-60 -left-2 -top-2" }
  };

  const highlightSizes = {
    sm: "w-12 h-6",
    md: "w-20 h-10",
    lg: "w-32 h-16"
  };

  return (
    <div className="relative">
      {/* Outer glow rings - pulsing */}
      {animated && (
        <>
          <div className={`absolute inset-0 ${glowSizes[size].outer} bg-gradient-to-br from-primary/40 via-accent/40 to-secondary/40 rounded-full blur-3xl animate-pulse`} />
          <div className={`absolute inset-0 ${glowSizes[size].inner} bg-gradient-to-br from-primary/30 via-accent/30 to-secondary/30 rounded-full blur-2xl animate-pulse`} style={{ animationDelay: '0.5s' }} />
        </>
      )}
      
      {/* Main orb */}
      <div
        className={`relative ${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary/90 via-accent/90 to-secondary/90 flex items-center justify-center shadow-2xl shadow-primary/20 ${animated ? 'animate-pulse' : ''}`}
        style={animated ? { animationDuration: '3s' } : {}}
      >
        {/* Inner reflection/highlight */}
        <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 ${highlightSizes[size]} bg-white/30 rounded-full blur-2xl`} />
        
        {/* Subtle particles */}
        {animated && (
          <>
            <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-white/60 rounded-full animate-pulse" />
            <div className="absolute bottom-1/3 left-1/4 w-1.5 h-1.5 bg-white/50 rounded-full animate-pulse delay-75" />
            <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-white/40 rounded-full animate-pulse delay-150" />
          </>
        )}
      </div>
    </div>
  );
};

export default VoiceBubbleLogo;
