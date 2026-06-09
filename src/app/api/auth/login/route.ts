import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { ensureLifeReadingForUser } from "@/lib/ensure-life-reading";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, getAuthCookieOptions, signSessionToken } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  if (user.isBanned) {
    return NextResponse.json({ error: "This account has been banned. Please contact support." }, { status: 403 });
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  try {
    await ensureLifeReadingForUser(user.id);
  } catch (error) {
    console.error("Unable to generate life reading during login", error);
  }

  const token = await signSessionToken({ userId: user.id, email: user.email, role: user.role });
  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      dailyFreeCredits: user.dailyFreeCredits,
      purchasedCredits: user.purchasedCredits,
    },
  });
  response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

  return response;
}
