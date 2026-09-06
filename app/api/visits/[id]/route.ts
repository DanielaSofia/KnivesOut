import { NextRequest, NextResponse } from "next/server";

import { prisma } from "../../../../lib/prisma";

type VisitRouteProps = {
  params: Promise<{ id: string }>;
};

export async function DELETE(
  _request: NextRequest,
  { params }: VisitRouteProps,
) {
  const visitId = Number((await params).id);

  if (!Number.isInteger(visitId)) {
    return NextResponse.json({ error: "Visita inválida." }, { status: 400 });
  }

  const user = await prisma.user.findFirst({ orderBy: { id: "asc" } });

  if (!user) {
    return NextResponse.json(
      { error: "Utilizador não encontrado." },
      { status: 404 },
    );
  }

  const visit = await prisma.visit.findFirst({
    where: { id: visitId, userId: user.id },
  });

  if (!visit) {
    return NextResponse.json(
      { error: "Visita não encontrada." },
      { status: 404 },
    );
  }

  await prisma.visit.delete({ where: { id: visitId } });

  return NextResponse.json({ deleted: true });
}
