import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import {
  publicRegistrationPolicy,
  REGISTRATION_POLICY_ID,
} from "@/lib/registration-policy";

export async function GET() {
  try {
    const policy = await prisma.registrationPolicy.findUnique({
      where: { id: REGISTRATION_POLICY_ID },
      select: {
        accessCodeEnabled: true,
        accessCodeHash: true,
        accessCodeHint: true,
      },
    });
    return NextResponse.json(publicRegistrationPolicy(policy));
  } catch {
    return NextResponse.json({ accessCodeEnabled: false, accessCodeHint: "" });
  }
}
