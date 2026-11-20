import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkWorkerToken } from "@/lib/auth";

export async function GET(request: Request) {
  if (!checkWorkerToken(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const settings = await prisma.cloudSettings.findUnique({ where: { id: 1 } });
  return NextResponse.json({
    coletorCloudEnabled: settings?.coletorCloudEnabled ?? false,
    hasSession: !!settings?.shopeeStorageState,
    sessionSavedAt: settings?.shopeeSessionSavedAt ?? null,
  });
}
