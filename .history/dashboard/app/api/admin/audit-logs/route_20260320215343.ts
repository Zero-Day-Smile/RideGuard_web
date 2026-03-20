import { NextResponse } from "next/server";
import { fetchBackend } from "../../_lib/backend";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit") ?? "20";

  const response = await fetchBackend(`/api/v1/admin/audit-logs?limit=${encodeURIComponent(limit)}`);
  const payload = await response.json();

  return NextResponse.json(payload, { status: response.status });
}
