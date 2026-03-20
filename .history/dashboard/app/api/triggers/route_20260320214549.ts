import { NextResponse } from "next/server";
import { fetchBackend } from "../_lib/backend";
import { disruptionSignals, triggerTimeline } from "../../data";

export async function GET() {
  try {
    const response = await fetchBackend("/api/v1/triggers");

    if (!response.ok) {
      throw new Error("Backend trigger fetch failed");
    }

    const payload = await response.json();
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({
      disruptionSignals,
      triggerTimeline,
      source: "fallback"
    });
  }
}
