import { NextResponse } from "next/server";
import { disruptionSignals, triggerTimeline } from "../../data";

export async function GET() {
  return NextResponse.json({
    disruptionSignals,
    triggerTimeline
  });
}
