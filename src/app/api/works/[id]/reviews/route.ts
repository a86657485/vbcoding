import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clampScore(value: unknown) {
  const score = Number(value);

  if (!Number.isFinite(score)) {
    return 3;
  }

  return Math.min(5, Math.max(1, Math.round(score)));
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = Number(params.id);

  if (!Number.isInteger(id)) {
    return Response.json({ error: "作品 ID 不正确" }, { status: 400 });
  }

  const body = (await request.json()) as {
    reviewerName?: string;
    promptScore?: number;
    functionScore?: number;
    experienceScore?: number;
    comment?: string;
  };

  const review = await prisma.review.create({
    data: {
      chatLogId: id,
      reviewerName: body.reviewerName?.trim() || "匿名评审官",
      promptScore: clampScore(body.promptScore),
      functionScore: clampScore(body.functionScore),
      experienceScore: clampScore(body.experienceScore),
      comment: body.comment?.trim().slice(0, 160) || "",
    },
  });

  return Response.json({ review });
}
