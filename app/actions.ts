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

export async function createRoutine(formData: FormData) {
  const agent = String(formData.get("agent") ?? "");
  const prompt = String(formData.get("prompt") ?? "").trim();
  const target = String(formData.get("target") ?? "local");
  const frequencyDays = Number(formData.get("frequencyDays") ?? 1);

  if (
    !VALID_AGENTS.includes(agent as (typeof VALID_AGENTS)[number]) ||
    !VALID_TARGETS.includes(target as (typeof VALID_TARGETS)[number]) ||
    !prompt ||
    !Number.isFinite(frequencyDays) ||
    frequencyDays < 1
  ) {
    return;
  }

  await prisma.routine.create({
    data: {
      agent,
      prompt,
      target: target as (typeof VALID_TARGETS)[number],
      frequencyDays: Math.round(frequencyDays),
    },
  });
  revalidatePath("/rotinas");
}

export async function toggleRoutine(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const enabled = formData.get("enabled") === "true";
  if (!id) return;
  await prisma.routine.update({ where: { id }, data: { enabled } });
  revalidatePath("/rotinas");
}

export async function deleteRoutine(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.routine.delete({ where: { id } });
  revalidatePath("/rotinas");
}

const REUNIAO_PROMPT =
  "convoque uma reunião: rode o ciclo da Doma Baby (coletor, depois vendas e marketing em paralelo lendo o mesmo snapshot) e escreva o plano do ciclo resolvendo os conflitos entre eles";

export async function convocarReuniao(formData: FormData) {
  const target = String(formData.get("target") ?? "local");
  if (!VALID_TARGETS.includes(target as (typeof VALID_TARGETS)[number])) return;

  await prisma.order.create({
    data: {
      agent: "gerente",
      prompt: REUNIAO_PROMPT,
      target: target as (typeof VALID_TARGETS)[number],
    },
  });
  revalidatePath("/reuniao");
}
