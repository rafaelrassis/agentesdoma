"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { destroySession } from "@/lib/auth";

const VALID_AGENTS = ["coletor", "marketing", "vendas", "gerente"] as const;
const VALID_TARGETS = ["local", "cloud"] as const;

export async function createOrder(formData: FormData) {
  const agent = String(formData.get("agent") ?? "");
  const prompt = String(formData.get("prompt") ?? "").trim();
  const target = String(formData.get("target") ?? "local");

  if (
    !VALID_AGENTS.includes(agent as (typeof VALID_AGENTS)[number]) ||
    !VALID_TARGETS.includes(target as (typeof VALID_TARGETS)[number]) ||
    !prompt
  ) {
    return;
  }

  await prisma.order.create({
    data: { agent, prompt, target: target as (typeof VALID_TARGETS)[number] },
  });
  revalidatePath("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

export async function toggleColetorCloud(formData: FormData) {
  const enabled = formData.get("enabled") === "true";
  await prisma.cloudSettings.upsert({
    where: { id: 1 },
    create: { id: 1, coletorCloudEnabled: enabled },
    update: { coletorCloudEnabled: enabled },
  });
  revalidatePath("/");
}
