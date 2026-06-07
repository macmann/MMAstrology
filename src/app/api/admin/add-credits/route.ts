import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function parsePositiveInteger(value: unknown) {
  const amount = typeof value === "string" ? Number(value) : value;

  if (typeof amount !== "number" || !Number.isSafeInteger(amount) || amount <= 0) {
    return null;
  }

  return amount;
}

export async function POST(request: Request) {
  const body = await request.json();
  const session = await getCurrentSession();
  const configuredSecret = process.env.ADMIN_SECRET;
  const providedSecret = request.headers.get("x-admin-secret") ?? (typeof body.adminSecret === "string" ? body.adminSecret : "");
  const isAdminUser = session?.role === "ADMIN";
  const hasAdminSecret = Boolean(configuredSecret && providedSecret === configuredSecret);

  if (!isAdminUser && !hasAdminSecret) {
    return NextResponse.json({ error: "Admin authorization is required." }, { status: 403 });
  }

  const targetUserId = typeof body.targetUserId === "string" ? body.targetUserId.trim() : "";
  const amount = parsePositiveInteger(body.amount);
  const reason =
    typeof body.reason === "string" && body.reason.trim()
      ? body.reason.trim()
      : `Admin manual credit addition${session?.userId ? ` by ${session.userId}` : " via admin secret"}`;

  if (!targetUserId) {
    return NextResponse.json({ error: "targetUserId is required." }, { status: 400 });
  }

  if (!amount) {
    return NextResponse.json({ error: "amount must be a positive integer." }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "Target user was not found." }, { status: 404 });
  }

  const [user, transaction] = await prisma.$transaction([
    prisma.user.update({
      where: { id: targetUserId },
      data: {
        purchasedCredits: {
          increment: amount,
        },
      },
      select: {
        id: true,
        email: true,
        purchasedCredits: true,
        dailyFreeCredits: true,
      },
    }),
    prisma.creditTransaction.create({
      data: {
        userId: targetUserId,
        amount,
        reason,
      },
      select: {
        id: true,
        amount: true,
        reason: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({ user, transaction });
}
