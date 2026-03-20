import { NextResponse } from "next/server";
import { fetchBackend } from "../../../_lib/backend";

export async function PATCH(request: Request, context: { params: Promise<{ alertId: string }> }) {
  const body = await request.json();
  const params = await context.params;

  const response = await fetchBackend(`/api/v1/admin/fraud-alerts/${params.alertId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const payload = await response.json();
  return NextResponse.json(payload, { status: response.status });
}
