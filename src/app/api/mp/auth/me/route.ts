import { NextRequest } from "next/server";
import { authenticateMpRequest, toMpSessionUser } from "@/lib/mp-auth";
import { mpSuccess } from "@/lib/mp-api";

export async function GET(req: NextRequest) {
  const result = await authenticateMpRequest(req);
  if (!result.ok) return result.response;

  return mpSuccess({ user: toMpSessionUser(result.auth.user) });
}
