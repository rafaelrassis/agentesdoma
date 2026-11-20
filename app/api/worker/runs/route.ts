import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkWorkerToken } from "@/lib/auth";

export async function POST(request: Request) {
  if (!checkWorkerToken(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const { agent, orderId } = body as { agent: string; orderId?: string };
  const run = await prisma.run.create({ data: { agent, orderId } });
  return NextResponse.json({ run });
}
