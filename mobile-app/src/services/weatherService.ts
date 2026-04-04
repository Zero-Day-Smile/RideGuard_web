const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || "";

export interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  riskScore: number; // 1-10
  alerts: string[];
}

const conditionRisk: Record<string, number> = {
  Clear: 1, Clouds: 2, Mist: 3, Drizzle: 5, Rain: 7, Thunderstorm: 9, Snow: 8, Fog: 6,
};

function calcRisk(w: any): number {
  const base = conditionRisk[w.weather?.[0]?.main] || 3;
  const windPenalty = w.wind?.speed > 10 ? 2 : w.wind?.speed > 6 ? 1 : 0;
  return Math.min(10, base + windPenalty);
}

export async function fetchWeather(city = "Mumbai"): Promise<WeatherData> {
  if (OPENWEATHER_API_KEY) {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${OPENWEATHER_API_KEY}`
      );
      if (!res.ok) throw new Error("API error");
      const d = await res.json();
      const risk = calcRisk(d);
      return {
        city,
        temp: Math.round(d.main.temp),
        condition: d.weather[0].main,
        icon: d.weather[0].icon,
        humidity: d.main.humidity,
        windSpeed: Math.round(d.wind.speed * 3.6),
        riskScore: risk,
        alerts: risk >= 7 ? [`⚠ ${d.weather[0].description} — high disruption risk`] : [],
      };
    } catch {
      // fall through to mock
    }
  }
  return mockWeather(city);
}

function mockWeather(city: string): WeatherData {
  const conditions = ["Clear", "Clouds", "Rain", "Drizzle", "Thunderstorm"];
  const idx = Math.floor(Math.random() * conditions.length);
  const cond = conditions[idx];
  const risk = conditionRisk[cond] || 3;
  return {
    city,
    temp: 25 + Math.floor(Math.random() * 15),
    condition: cond,
    icon: "10d",
    humidity: 50 + Math.floor(Math.random() * 40),
    windSpeed: 5 + Math.floor(Math.random() * 30),
    riskScore: risk,
    alerts: risk >= 7 ? [`⚠ ${cond} conditions — high disruption risk`] : [],
  };
}
