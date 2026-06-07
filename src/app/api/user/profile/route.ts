import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function parseDateOfBirth(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const dob = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(dob.getTime())) {
    return null;
  }

  const normalized = dob.toISOString().slice(0, 10);

  if (normalized !== value) {
    return null;
  }

  return dob;
}

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "You must be logged in to view your profile." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      role: true,
      dailyFreeCredits: true,
      purchasedCredits: true,
      lastCreditReset: true,
      createdAt: true,
      updatedAt: true,
      astrologicalProfile: true,
      creditTransactions: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amount: true,
          reason: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User was not found." }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PUT(request: Request) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "You must be logged in to update your profile." }, { status: 401 });
  }

  const body = await request.json();
  const dob = parseDateOfBirth(body.dob);
  const birthTime = typeof body.birthTime === "string" ? body.birthTime.trim() : "";
  const birthLocation = typeof body.birthLocation === "string" ? body.birthLocation.trim() : "";

  if (!dob) {
    return NextResponse.json({ error: "Please enter a valid date of birth." }, { status: 400 });
  }

  if (!birthTime) {
    return NextResponse.json({ error: "Please enter your birth time." }, { status: 400 });
  }

  if (!birthLocation) {
    return NextResponse.json({ error: "Please enter your birth location." }, { status: 400 });
  }

  const profile = await prisma.astrologicalProfile.upsert({
    where: { userId: session.userId },
    update: {
      dob,
      birthTime,
      birthLocation,
    },
    create: {
      userId: session.userId,
      dob,
      birthTime,
      birthLocation,
    },
  });

  return NextResponse.json({ profile });
}
