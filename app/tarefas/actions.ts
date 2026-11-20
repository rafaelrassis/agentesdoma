"use server";

import { revalidatePath } from "next/cache";
import { Prisma, TaskColumn } from "@prisma/client";
import { prisma } from "@/lib/db";

const VALID_COLUMNS = Object.values(TaskColumn);

export async function createTask(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const detail = String(formData.get("detail") ?? "").trim();
  const column = String(formData.get("column") ?? "backlog");

  if (!title || !VALID_COLUMNS.includes(column as TaskColumn)) return;

  const last = await prisma.task.findFirst({
    where: { column: column as TaskColumn },
    orderBy: { position: "desc" },
  });

  try {
    await prisma.task.create({
      data: {
        title,
        detail: detail || null,
        column: column as TaskColumn,
        createdBy: "rafael",
        position: (last?.position ?? -1) + 1,
      },
    });
  } catch (err) {
    if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002")) throw err;
  }
  revalidatePath("/tarefas");
}

export async function moveTask(id: string, column: string) {
  if (!VALID_COLUMNS.includes(column as TaskColumn)) return;

  const last = await prisma.task.findFirst({
    where: { column: column as TaskColumn },
    orderBy: { position: "desc" },
  });

  await prisma.task.update({
    where: { id },
    data: { column: column as TaskColumn, position: (last?.position ?? -1) + 1 },
  });
  revalidatePath("/tarefas");
}

export async function deleteTask(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.task.delete({ where: { id } }).catch(() => {});
  revalidatePath("/tarefas");
}
