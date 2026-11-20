"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { destroySession } from "@/lib/auth";

const VALID_AGENTS = ["coletor", "marketing", "vendas", "gerente"] as const;

export async function createOrder(formData: FormData) {
  const agent = String(formData.get("agent") ?? "");
  const prompt = String(formData.get("prompt") ?? "").trim();

  if (!VALID_AGENTS.includes(agent as (typeof VALID_AGENTS)[number]) || !prompt) {
    return;
  }

  await prisma.order.create({ data: { agent, prompt } });
  revalidatePath("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
