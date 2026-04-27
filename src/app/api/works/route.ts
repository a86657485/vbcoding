import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const studentClass = request.nextUrl.searchParams.get("studentClass")?.trim();

  const works = await prisma.chatLog.findMany({
    where: {
      generatedCode: {
        not: "",
      },
      ...(studentClass && studentClass !== "全部"
        ? {
            studentClass,
          }
        : {}),
    },
    include: {
      reviews: {
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
      },
    },
    orderBy: [
      {
        likes: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    take: 200,
  });

  return Response.json({
    works: works
      .filter((work) => !work.generatedCode.startsWith("<!--"))
      .map((work) => {
        const reviewCount = work.reviews.length;
        const averageScore = reviewCount
          ? work.reviews.reduce(
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
          ...work,
          reviewCount,
          averageScore: Number(averageScore.toFixed(1)),
        };
      }),
  });
}
