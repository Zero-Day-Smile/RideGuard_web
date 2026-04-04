const ScooterLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-8">
      {/* Road + Scooter animation */}
      <div className="relative w-64 h-24 overflow-hidden">
        {/* Scooter SVG */}
        <div className="absolute bottom-6 animate-scooter" style={{ left: '-30%' }}>
          <svg width="60" height="40" viewBox="0 0 60 40" fill="none" className="text-primary">
            {/* Body */}
            <rect x="10" y="10" width="30" height="14" rx="4" fill="currentColor" />
            {/* Handlebar */}
            <rect x="38" y="4" width="4" height="12" rx="2" fill="currentColor" />
            <rect x="34" y="2" width="12" height="4" rx="2" fill="currentColor" />
            {/* Seat */}
            <rect x="14" y="6" width="14" height="5" rx="2.5" fill="hsl(var(--accent))" />
            {/* Package/delivery box */}
            <rect x="4" y="4" width="12" height="10" rx="2" fill="hsl(var(--warning))" />
            <rect x="6" y="6" width="8" height="1" rx="0.5" fill="hsl(var(--warning-foreground))" />
            {/* Front wheel */}
            <circle cx="42" cy="30" r="7" stroke="currentColor" strokeWidth="3" fill="none" className="animate-wheel" />
            <circle cx="42" cy="30" r="2" fill="currentColor" />
            {/* Back wheel */}
            <circle cx="14" cy="30" r="7" stroke="currentColor" strokeWidth="3" fill="none" className="animate-wheel" />
            <circle cx="14" cy="30" r="2" fill="currentColor" />
            {/* Rider silhouette */}
            <circle cx="22" cy="-2" r="5" fill="hsl(var(--muted-foreground))" />
            <rect x="19" y="2" width="6" height="6" rx="2" fill="hsl(var(--muted-foreground))" />
          </svg>
        </div>
        {/* Road */}
        <div className="absolute bottom-0 w-full h-1 bg-muted rounded-full overflow-hidden">
          <div className="absolute w-[200%] h-full flex animate-road">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="flex items-center gap-2 mx-2">
                <div className="w-6 h-0.5 bg-muted-foreground/30 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-xl font-bold text-gradient">RideGuard</h2>
        <p className="text-sm text-muted-foreground">Loading your coverage...</p>
      </div>
    </div>
  );
};

export default ScooterLoader;
