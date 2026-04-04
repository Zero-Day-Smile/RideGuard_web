export interface DeliveryPlatform {
  id: string;
  name: string;
  logo: string;
  connected: boolean;
  status: "online" | "offline" | "degraded";
  ridesCompleted: number;
  earnings: number;
  rating: number;
  lastSync: Date;
  outageRisk: number; // 1-10
}

export interface PlatformOutageEvent {
  id: string;
  platform: string;
  type: "outage" | "degraded" | "maintenance";
  description: string;
  startTime: Date;
  resolved: boolean;
  impactScore: number;
}

const platformData: DeliveryPlatform[] = [
  { id: "swiggy", name: "Swiggy", logo: "🟠", connected: false, status: "online", ridesCompleted: 342, earnings: 28500, rating: 4.7, lastSync: new Date(), outageRisk: 2 },
  { id: "zomato", name: "Zomato", logo: "🔴", connected: false, status: "online", ridesCompleted: 218, earnings: 19200, rating: 4.5, lastSync: new Date(), outageRisk: 3 },
  { id: "uber_eats", name: "Uber Eats", logo: "🟢", connected: false, status: "online", ridesCompleted: 156, earnings: 14800, rating: 4.8, lastSync: new Date(), outageRisk: 1 },
  { id: "dunzo", name: "Dunzo", logo: "🟡", connected: false, status: "degraded", ridesCompleted: 89, earnings: 7600, rating: 4.3, lastSync: new Date(), outageRisk: 5 },
  { id: "blinkit", name: "Blinkit", logo: "🟣", connected: false, status: "online", ridesCompleted: 67, earnings: 5400, rating: 4.6, lastSync: new Date(), outageRisk: 2 },
];

let connectedPlatforms: Set<string> = new Set();

export function getPlatforms(): DeliveryPlatform[] {
  return platformData.map(p => ({
    ...p,
    connected: connectedPlatforms.has(p.id),
    status: Math.random() > 0.9 ? "degraded" : Math.random() > 0.95 ? "offline" : "online",
    lastSync: new Date(),
  }));
}

export function connectPlatform(id: string): DeliveryPlatform | null {
  connectedPlatforms.add(id);
  return getPlatforms().find(p => p.id === id) || null;
}

export function disconnectPlatform(id: string): void {
  connectedPlatforms.delete(id);
}

export function getOutageEvents(): PlatformOutageEvent[] {
  const events: PlatformOutageEvent[] = [];
  const types: Array<"outage" | "degraded" | "maintenance"> = ["outage", "degraded", "maintenance"];
  
  platformData.forEach(p => {
    if (Math.random() > 0.6) {
      events.push({
        id: `outage-${p.id}-${Date.now()}`,
        platform: p.name,
        type: types[Math.floor(Math.random() * types.length)],
        description: `${p.name} experiencing ${types[Math.floor(Math.random() * types.length)]} in select areas`,
        startTime: new Date(Date.now() - Math.random() * 7200000),
        resolved: Math.random() > 0.5,
        impactScore: Math.floor(Math.random() * 5) + 1,
      });
    }
  });
  return events;
}

export function getPlatformOutageRisk(): number {
  const platforms = getPlatforms().filter(p => p.connected);
  if (platforms.length === 0) return 3;
  return Math.round(platforms.reduce((sum, p) => sum + p.outageRisk, 0) / platforms.length);
}
