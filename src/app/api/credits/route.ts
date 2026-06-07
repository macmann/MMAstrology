import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { checkAndResetCredits } from "@/lib/credits";

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "You must be logged in to view credits." }, { status: 401 });
  }

  const credits = await checkAndResetCredits(session.userId);

  if (!credits) {
    return NextResponse.json({ error: "User was not found." }, { status: 404 });
  }

  return NextResponse.json({
    freeCredits: credits.dailyFreeCredits,
    purchasedCredits: credits.purchasedCredits,
  });
}
