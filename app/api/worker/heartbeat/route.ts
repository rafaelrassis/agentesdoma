import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkWorkerToken } from "@/lib/auth";

export async function POST(request: Request) {
  if (!checkWorkerToken(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const target = body.target === "cloud" ? "cloud" : "local";
  await prisma.workerHeartbeat.upsert({
    where: { target },
    create: { target, lastSeenAt: new Date() },
    update: { lastSeenAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
