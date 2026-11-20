import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkWorkerToken } from "@/lib/auth";

export async function POST(request: Request) {
  if (!checkWorkerToken(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const { date, data } = body as { date: string; data: unknown };
  const snapshot = await prisma.snapshot.create({ data: { date, data: data as object } });
  return NextResponse.json({ snapshot });
}
