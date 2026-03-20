import { NextResponse } from "next/server";
import { fetchBackend } from "../../_lib/backend";
import { cityRiskBands, fraudAlerts, weeklyMetrics } from "../../../data";

export async function GET() {
  try {
    const response = await fetchBackend("/api/v1/admin/overview");

    if (!response.ok) {
      throw new Error("Backend admin overview fetch failed");
    }

    const payload = await response.json();
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({
      weeklyMetrics,
      fraudAlerts,
      cityRiskBands,
      source: "fallback"
    });
  }
}
