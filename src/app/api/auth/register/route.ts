import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getDailyFreeCreditAllowance } from "@/lib/credit-settings";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, getAuthCookieOptions, signSessionToken } from "@/lib/auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export async function POST(request: Request) {
  const body = await request.json();
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.` },
      { status: 400 },
    );
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const dailyFreeCreditAllowance = await getDailyFreeCreditAllowance();
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      dailyFreeCredits: dailyFreeCreditAllowance,
    },
    select: {
      id: true,
      email: true,
      role: true,
      dailyFreeCredits: true,
      purchasedCredits: true,
    },
  });

  const token = await signSessionToken({ userId: user.id, email: user.email, role: user.role });
  const response = NextResponse.json({ user }, { status: 201 });
  response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

  return response;
}
