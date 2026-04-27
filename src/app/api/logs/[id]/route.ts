import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = Number(params.id);

  if (!Number.isInteger(id)) {
    return Response.json({ error: "记录 ID 不正确" }, { status: 400 });
  }

  await prisma.review.deleteMany({
    where: {
      chatLogId: id,
    },
  });

  await prisma.chatLog.delete({
    where: {
      id,
    },
  });

  return Response.json({
    ok: true,
    deletedId: id,
  });
}
