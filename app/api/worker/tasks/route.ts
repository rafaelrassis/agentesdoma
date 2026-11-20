import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { checkWorkerToken } from "@/lib/auth";

export async function POST(request: Request) {
  if (!checkWorkerToken(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const title = String(body.title ?? "").trim();
  const createdBy = String(body.createdBy ?? "").trim();
  if (!title || !createdBy) {
    return NextResponse.json({ error: "title and createdBy required" }, { status: 400 });
  }

  try {
    const task = await prisma.task.create({
      data: { title, createdBy, column: "backlog" },
    });
    return NextResponse.json({ task, created: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ created: false, reason: "already exists" });
    }
    throw err;
  }
}
