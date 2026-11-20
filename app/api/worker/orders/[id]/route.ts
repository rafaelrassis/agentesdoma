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
  const { status, result } = body as { status: "claimed" | "running" | "done" | "failed"; result?: string };

  const data: { status: typeof status; result?: string; claimedAt?: Date; finishedAt?: Date } = { status };
  if (result !== undefined) data.result = result;
  if (status === "claimed") data.claimedAt = new Date();
  if (status === "done" || status === "failed") data.finishedAt = new Date();

  const order = await prisma.order.update({ where: { id }, data });
  return NextResponse.json({ order });
}
