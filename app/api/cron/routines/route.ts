import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkCronSecret } from "@/lib/auth";

export async function GET(request: Request) {
  if (!checkCronSecret(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const routines = await prisma.routine.findMany({ where: { enabled: true } });
  const now = new Date();
  const created: string[] = [];

  for (const routine of routines) {
    const dueAt = routine.lastRunAt
      ? new Date(routine.lastRunAt.getTime() + routine.frequencyDays * 24 * 60 * 60 * 1000)
      : now;
    if (dueAt > now) continue;

    await prisma.order.create({
      data: {
        agent: routine.agent,
        prompt: routine.prompt,
        target: routine.target,
        model: routine.model,
      },
    });
    await prisma.routine.update({ where: { id: routine.id }, data: { lastRunAt: now } });
    created.push(routine.id);
  }

  return NextResponse.json({ created });
}
