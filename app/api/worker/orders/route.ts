import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkWorkerToken } from "@/lib/auth";

export async function GET(request: Request) {
  if (!checkWorkerToken(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("target");
  const where =
    target === "local" || target === "cloud"
      ? { status: "pending" as const, target: target as "local" | "cloud" }
      : { status: "pending" as const };
  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ orders });
}
