import { fetchWeather, type WeatherData } from "./weatherService";
import { fetchTrafficData, type TrafficData } from "./trafficService";
import { getPlatformOutageRisk } from "./platformService";

export interface PremiumBreakdown {
  basePremium: number;
  weatherRisk: number;
  trafficRisk: number;
  platformRisk: number;
  claimSurcharge: number;
  nightSurcharge: number;
  distanceFactor: number;
  reliabilityDiscount: number;
  totalPremium: number;
  previousPremium: number;
  change: number;
  suggestedHours: number;
  weatherData: WeatherData | null;
  trafficData: TrafficData | null;
}

export interface PremiumInputs {
  coverage: number;
  cityRisk: number;
  claimFreq: number;
  distance: number;
  nightRatio: number;
  reliability: number;
}

export async function calculateDynamicPremium(inputs: PremiumInputs, city = "Mumbai"): Promise<PremiumBreakdown> {
  let weatherData: WeatherData | null = null;
  let trafficData: TrafficData | null = null;

  try {
    [weatherData, trafficData] = await Promise.all([
      fetchWeather(city),
      Promise.resolve(fetchTrafficData(city)),
    ]);
  } catch {
    // use defaults
  }

  const weatherRisk = weatherData?.riskScore ?? 4;
  const trafficRisk = trafficData?.riskScore ?? 5;
  const platformRisk = getPlatformOutageRisk();

  const basePremium = (inputs.coverage / 1000) * 2;
  const riskMultiplier = 1 + (inputs.cityRisk + weatherRisk + trafficRisk + platformRisk) / 100;
  const claimSurcharge = inputs.claimFreq * 8;
  const distanceFactor = inputs.distance / 200;
  const nightSurcharge = inputs.nightRatio * 0.3;
  const reliabilityDiscount = (inputs.reliability / 100) * 15;

  const rawPremium = (basePremium * riskMultiplier + claimSurcharge + nightSurcharge) * distanceFactor;
  const totalPremium = Math.max(49, Math.round(rawPremium - reliabilityDiscount));
  const previousPremium = 149;

  return {
    basePremium: Math.round(basePremium),
    weatherRisk,
    trafficRisk,
    platformRisk,
    claimSurcharge,
    nightSurcharge: Math.round(nightSurcharge),
    distanceFactor: Math.round(distanceFactor * 100) / 100,
    reliabilityDiscount: Math.round(reliabilityDiscount),
    totalPremium,
    previousPremium,
    change: totalPremium - previousPremium,
    suggestedHours: Math.min(60, Math.max(20, Math.round(inputs.distance / 4))),
    weatherData,
    trafficData,
  };
}
