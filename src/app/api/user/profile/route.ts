import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { ensureLifeReadingForUser } from "@/lib/ensure-life-reading";
import { checkAndResetCredits } from "@/lib/credits";
import { prisma } from "@/lib/prisma";

const MIN_PASSWORD_LENGTH = 8;
const MAX_NAME_LENGTH = 80;

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

function parseProfileFields(body: Record<string, unknown>) {
  const dob = parseDateOfBirth(body.dob);
  const birthTime = typeof body.birthTime === "string" ? body.birthTime.trim() : "";
  const birthLocation = typeof body.birthLocation === "string" ? body.birthLocation.trim() : "";

  if (!dob) {
    return { error: "Please enter a valid date of birth." };
  }

  if (!birthTime) {
    return { error: "Please enter your birth time." };
  }

  if (!birthLocation) {
    return { error: "Please enter your birth location." };
  }

  return { dob, birthTime, birthLocation };
}

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "You must be logged in to view your profile." }, { status: 401 });
  }

  await checkAndResetCredits(session.userId);

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
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

  const body = (await request.json()) as Record<string, unknown>;
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
  const isPasswordUpdate = currentPassword.length > 0 || newPassword.length > 0;

  if (isPasswordUpdate) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Please enter your current password." }, { status: 400 });
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters long.` },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { passwordHash: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User was not found." }, { status: 404 });
    }

    const passwordMatches = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!passwordMatches) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: session.userId },
      data: { passwordHash },
      select: { id: true },
    });

    return NextResponse.json({ ok: true });
  }

  const profileFields = parseProfileFields(body);

  if ("error" in profileFields) {
    return NextResponse.json({ error: profileFields.error }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (name.length > MAX_NAME_LENGTH) {
    return NextResponse.json({ error: `Name must be ${MAX_NAME_LENGTH} characters or fewer.` }, { status: 400 });
  }

  const existingProfile = await prisma.astrologicalProfile.findUnique({
    where: { userId: session.userId },
    select: { dob: true, birthTime: true, birthLocation: true },
  });
  const didBirthProfileChange =
    !existingProfile ||
    existingProfile.dob.toISOString().slice(0, 10) !== profileFields.dob.toISOString().slice(0, 10) ||
    existingProfile.birthTime !== profileFields.birthTime ||
    existingProfile.birthLocation !== profileFields.birthLocation;

  const [user, profile] = await prisma.$transaction([
    prisma.user.update({
      where: { id: session.userId },
      data: { name: name || null },
      select: { id: true, name: true, updatedAt: true },
    }),
    prisma.astrologicalProfile.upsert({
      where: { userId: session.userId },
      update: {
        dob: profileFields.dob,
        birthTime: profileFields.birthTime,
        birthLocation: profileFields.birthLocation,
        ...(didBirthProfileChange
          ? {
              dailyReadingEn: null,
              dailyReadingMy: null,
              dailyReadingDate: null,
            }
          : {}),
      },
      create: {
        userId: session.userId,
        dob: profileFields.dob,
        birthTime: profileFields.birthTime,
        birthLocation: profileFields.birthLocation,
      },
    }),
  ]);

  const profileWithReading = didBirthProfileChange ? await ensureLifeReadingForUser(session.userId) : profile;

  return NextResponse.json({ user, profile: profileWithReading });
}
