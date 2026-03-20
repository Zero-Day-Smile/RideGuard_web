import { NextResponse } from "next/server";
import { fetchBackend } from "../../_lib/backend";
import { riderSnapshot, weeklyMetrics } from "../../../data";

export async function GET() {
  try {
    const response = await fetchBackend("/api/v1/rider/summary");

    if (!response.ok) {
      throw new Error("Backend rider summary fetch failed");
    }

    const payload = await response.json();
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({
      weeklyMetrics,
      riderSnapshot,
      source: "fallback"
    });
  }
}
