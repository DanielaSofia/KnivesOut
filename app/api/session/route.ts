import { NextResponse } from "next/server";

import {
  ACTIVE_USER_COOKIE,
  getAvailableUsers,
} from "../../../lib/session";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Perfil inválido." }, { status: 400 });
  }

  const userId =
    typeof body === "object" && body !== null && "userId" in body
      ? Number(body.userId)
      : NaN;

  if (!Number.isInteger(userId)) {
    return NextResponse.json({ error: "Perfil inválido." }, { status: 400 });
  }

  const users = await getAvailableUsers();

  if (!users.some((user) => user.id === userId)) {
    return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
  }

  const response = NextResponse.json({ userId });
  response.cookies.set(ACTIVE_USER_COOKIE, String(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  return response;
}