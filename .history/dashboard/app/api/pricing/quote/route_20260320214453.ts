import { NextResponse } from "next/server";
import { fetchBackend } from "../../_lib/backend";

type QuoteRequest = {
  basePremium: number;
  locationRisk: number;
  weatherFactor: number;
  incomeVariability: number;
  reliabilityDiscount: number;
};

function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<QuoteRequest>;

  try {
    const response = await fetchBackend("/api/v1/pricing/quote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error("Backend pricing quote fetch failed");
    }

    const payload = await response.json();
    return NextResponse.json(payload);
  } catch {
    const basePremium = clamp(Number(body.basePremium ?? 0), 1, 100000);
    const locationRisk = clamp(Number(body.locationRisk ?? 0), 0, 1);
    const weatherFactor = clamp(Number(body.weatherFactor ?? 0), 0, 1);
    const incomeVariability = clamp(Number(body.incomeVariability ?? 0), 0, 1);
    const reliabilityDiscount = clamp(Number(body.reliabilityDiscount ?? 0), 0, 0.4);

    const weightedRisk = 0.4 * locationRisk + 0.35 * weatherFactor + 0.25 * incomeVariability;
    const riskMultiplier = 1 + weightedRisk;
    const rawPremium = basePremium * riskMultiplier;
    const discountValue = rawPremium * reliabilityDiscount;

    const computedPremium = Math.max(12, Math.round(rawPremium - discountValue));
    const riskScore = Math.round(
      100 * (0.45 * locationRisk + 0.35 * weatherFactor + 0.2 * incomeVariability)
    );

    return NextResponse.json({
      computedPremium,
      riskScore,
      source: "fallback",
      factors: {
        locationRisk,
        weatherFactor,
        incomeVariability,
        reliabilityDiscount
      }
    });
  }
}
