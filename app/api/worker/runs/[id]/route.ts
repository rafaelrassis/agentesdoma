import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkWorkerToken } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkWorkerToken(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json();
  const { status, summary } = body as { status: "completed" | "failed"; summary?: string };

  const run = await prisma.run.update({
    where: { id },
    data: { status, summary, finishedAt: new Date() },
  });
  return NextResponse.json({ run });
}
