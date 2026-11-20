import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkWorkerToken } from "@/lib/auth";

export async function POST(request: Request) {
  if (!checkWorkerToken(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const target = body.target === "cloud" ? "cloud" : "local";
  const loggedIn = typeof body.loggedIn === "boolean" ? body.loggedIn : null;
  const detail = typeof body.detail === "string" ? body.detail.slice(0, 300) : null;

  await prisma.shopeeLogin.upsert({
    where: { target },
    create: { target, loggedIn, detail },
    update: { loggedIn, detail },
  });
  return NextResponse.json({ ok: true });
}
