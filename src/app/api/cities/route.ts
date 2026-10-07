import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { denyIfNoAccess, jsonError } from "@/lib/api";
import { getCities } from "@/lib/geo/cities";
import { isUf } from "@/lib/geo/states";

export async function GET(request: NextRequest) {
  const denied = denyIfNoAccess(request);
  if (denied) return denied;

  const uf = request.nextUrl.searchParams.get("uf");
  if (!isUf(uf)) return jsonError("Estado inválido.", 400);

  try {
    return NextResponse.json({ cities: await getCities(uf) });
  } catch {
    // The datalist is a convenience; the form still works by typing the city.
    return NextResponse.json({ cities: [] });
  }
}
