import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkWorkerToken } from "@/lib/auth";

export async function GET(request: Request) {
  if (!checkWorkerToken(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const orders = await prisma.order.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ orders });
}
