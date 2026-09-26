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
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const isSecure = forwardedProto
    ? forwardedProto.split(",", 1)[0].trim() === "https"
    : new URL(request.url).protocol === "https:";

  response.cookies.set(ACTIVE_USER_COOKIE, String(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  return response;
}