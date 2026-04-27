import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = Number(params.id);

  if (!Number.isInteger(id)) {
    return Response.json({ error: "作品 ID 不正确" }, { status: 400 });
  }

  const work = await prisma.chatLog.update({
    where: {
      id,
    },
    data: {
      likes: {
        increment: 1,
      },
    },
    select: {
      id: true,
      likes: true,
    },
  });

  return Response.json({ work });
}
