import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("studentName")?.trim();
  const studentClass = request.nextUrl.searchParams.get("studentClass")?.trim();

  const logs = await prisma.chatLog.findMany({
    where: {
      ...(search
        ? {
          studentName: {
            contains: search,
          },
        }
        : {}),
      ...(studentClass && studentClass !== "全部"
        ? {
            studentClass,
          }
        : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      reviews: {
        select: {
          promptScore: true,
          functionScore: true,
          experienceScore: true,
        },
      },
    },
    take: 200,
  });

  return Response.json({
    logs: logs.map((log) => {
      const reviewCount = log.reviews.length;
      const averageScore = reviewCount
        ? log.reviews.reduce(
            (total, review) =>
              total +
              (review.promptScore +
                review.functionScore +
                review.experienceScore) /
                3,
            0,
          ) / reviewCount
        : 0;
      return {
        id: log.id,
        studentName: log.studentName,
        studentClass: log.studentClass,
        workTitle: log.workTitle,
        prompt: log.prompt,
        generatedCode: log.generatedCode,
        likes: log.likes,
        createdAt: log.createdAt,
        reviewCount,
        averageScore: Number(averageScore.toFixed(1)),
      };
    }),
  });
}

export async function DELETE() {
  await prisma.review.deleteMany();
  const result = await prisma.chatLog.deleteMany();

  return Response.json({
    ok: true,
    deletedCount: result.count,
  });
}
