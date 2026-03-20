import { NextResponse } from "next/server";
import { fetchBackend } from "../../_lib/backend";

export async function POST(request: Request) {
  const body = await request.json();

  const response = await fetchBackend("/api/v1/admin/fraud-alerts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const payload = await response.json();
  return NextResponse.json(payload, { status: response.status });
}
