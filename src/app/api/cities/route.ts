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
    // Alphabetical with Portuguese collation, so "Água Boa" sits with the A's.
    const cities = (await getCities(uf)).sort((a, b) => a.localeCompare(b, "pt-BR"));
    return NextResponse.json({ cities });
  } catch {
    // The form falls back to a text field when the list is empty.
    return NextResponse.json({ cities: [] });
  }
}
