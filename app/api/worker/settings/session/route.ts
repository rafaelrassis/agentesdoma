import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { checkWorkerToken } from "@/lib/auth";

export async function GET(request: Request) {
  if (!checkWorkerToken(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const settings = await prisma.cloudSettings.findUnique({ where: { id: 1 } });
  if (!settings?.shopeeStorageState) {
    return NextResponse.json({ error: "no session saved" }, { status: 404 });
  }
  return NextResponse.json({ storageState: settings.shopeeStorageState });
}

export async function POST(request: Request) {
  if (!checkWorkerToken(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const { storageState } = body as { storageState: unknown };
  if (!storageState) {
    return NextResponse.json({ error: "storageState required" }, { status: 400 });
  }
  await prisma.cloudSettings.upsert({
    where: { id: 1 },
    create: { id: 1, shopeeStorageState: storageState as object, shopeeSessionSavedAt: new Date() },
    update: { shopeeStorageState: storageState as object, shopeeSessionSavedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!checkWorkerToken(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await prisma.cloudSettings.upsert({
    where: { id: 1 },
    create: { id: 1, shopeeStorageState: undefined, shopeeSessionSavedAt: null },
    update: { shopeeStorageState: Prisma.JsonNull, shopeeSessionSavedAt: null },
  });
  return NextResponse.json({ ok: true });
}
