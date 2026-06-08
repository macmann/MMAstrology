import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const SNIPPET_LENGTH = 60;

function toSnippet(content: string) {
  const normalizedContent = content.replace(/\s+/g, " ").trim();

  if (normalizedContent.length <= SNIPPET_LENGTH) {
    return normalizedContent;
  }

  return `${normalizedContent.slice(0, SNIPPET_LENGTH).trimEnd()}…`;
}

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "You must be logged in to view chat history." }, { status: 401 });
  }

  const messages = await prisma.message.findMany({
    where: {
      userId: session.userId,
    },
    orderBy: [
      {
        createdAt: "desc",
      },
      {
        id: "desc",
      },
    ],
    select: {
      providerName: true,
      role: true,
      content: true,
      createdAt: true,
    },
  });

  const latestByProvider = new Map<string, (typeof messages)[number]>();

  for (const message of messages) {
    if (!latestByProvider.has(message.providerName)) {
      latestByProvider.set(message.providerName, message);
    }
  }

  return NextResponse.json({
    history: Array.from(latestByProvider.values()).map((message) => ({
      providerName: message.providerName,
      snippet: toSnippet(message.content),
      role: message.role,
      createdAt: message.createdAt.toISOString(),
    })),
  });
}

export async function DELETE(request: Request) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "You must be logged in to delete chat history." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const providerName = searchParams.get("providerName")?.trim();

  if (!providerName) {
    return NextResponse.json({ error: "providerName is required." }, { status: 400 });
  }

  const result = await prisma.message.deleteMany({
    where: {
      userId: session.userId,
      providerName,
    },
  });

  return NextResponse.json({
    providerName,
    deletedCount: result.count,
  });
}
