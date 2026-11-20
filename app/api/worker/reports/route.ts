import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkWorkerToken } from "@/lib/auth";

export async function POST(request: Request) {
  if (!checkWorkerToken(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const { agent, date, path, content } = body as {
    agent: string;
    date: string;
    path: string;
    content: string;
  };
  const report = await prisma.report.upsert({
    where: { agent_path: { agent, path } },
    create: { agent, date, path, content },
    update: { date, content },
  });
  return NextResponse.json({ report });
}
