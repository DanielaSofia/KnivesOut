import { cookies } from "next/headers";

import { prisma } from "./prisma";

export const ACTIVE_USER_COOKIE = "knivesout_user";

export async function getAvailableUsers() {
  return prisma.user.findMany({
    orderBy: { id: "asc" },
    take: 2,
    select: { id: true, name: true },
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = Number(cookieStore.get(ACTIVE_USER_COOKIE)?.value);

  if (Number.isInteger(userId)) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (user) {
      return user;
    }
  }

  return prisma.user.findFirst({ orderBy: { id: "asc" } });
}