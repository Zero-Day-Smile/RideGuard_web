export interface TrafficData {
  zone: string;
  congestionLevel: number; // 1-10
  avgSpeed: number; // km/h
  incidents: TrafficIncident[];
  riskScore: number;
}

export interface TrafficIncident {
  id: string;
  type: "accident" | "construction" | "closure" | "event";
  description: string;
  severity: "low" | "medium" | "high";
  location: string;
  timestamp: Date;
}

const zones = [
  { zone: "Downtown", baseCongestion: 7, baseSpeed: 18 },
  { zone: "Suburbs", baseCongestion: 4, baseSpeed: 35 },
  { zone: "Highway", baseCongestion: 5, baseSpeed: 50 },
  { zone: "Market Area", baseCongestion: 8, baseSpeed: 12 },
];

const incidentTypes: TrafficIncident[] = [
  { id: "t1", type: "accident", description: "Minor collision on MG Road", severity: "medium", location: "MG Road", timestamp: new Date() },
  { id: "t2", type: "construction", description: "Road widening near station", severity: "low", location: "Station Rd", timestamp: new Date() },
  { id: "t3", type: "closure", description: "Road closed for rally", severity: "high", location: "Ring Road", timestamp: new Date() },
  { id: "t4", type: "event", description: "Festival crowd near temple", severity: "medium", location: "Temple St", timestamp: new Date() },
];

export function fetchTrafficData(city = "Mumbai"): TrafficData {
  const hour = new Date().getHours();
  const isPeak = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
  const peakMul = isPeak ? 1.4 : 1;
  const randomVariation = () => 0.8 + Math.random() * 0.4;

  const zone = zones[Math.floor(Math.random() * zones.length)];
  const congestion = Math.min(10, Math.round(zone.baseCongestion * peakMul * randomVariation()));
  const speed = Math.max(5, Math.round(zone.baseSpeed / (peakMul * randomVariation())));
  
  const activeIncidents = incidentTypes
    .filter(() => Math.random() > 0.5)
    .map(i => ({ ...i, timestamp: new Date(Date.now() - Math.random() * 3600000) }));

  return {
    zone: `${city} — ${zone.zone}`,
    congestionLevel: congestion,
    avgSpeed: speed,
    incidents: activeIncidents,
    riskScore: Math.min(10, Math.round(congestion * 0.7 + activeIncidents.length * 1.5)),
  };
}
