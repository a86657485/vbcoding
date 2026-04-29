import { NextRequest } from "next/server";
import {
  DEEPSEEK_API_KEY,
  DEEPSEEK_CHAT_COMPLETIONS_URL,
  DEEPSEEK_MODEL,
} from "@/lib/deepseek";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fallbackIdea = {
  title: "✨ 奇思妙想发生器",
  prompt:
    "帮我写一个纯HTML网页。功能是一个【奇思妙想按钮】，点击后随机生成【未来发明、小小冒险、魔法任务】三个创意选项，并展示一张漂亮的创意卡片。风格是【未来实验室风】。特效要有【按钮发光、卡片翻转、星星粒子动画】。",
};

function extractJson(text: string) {
  const match = text.match(/\{[\s\S]*\}/);

  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[0]) as { title?: string; prompt?: string };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    studentName?: string;
    studentClass?: string;
  };

  try {
    const response = await fetch(DEEPSEEK_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        temperature: 0.95,
        messages: [
          {
            role: "system",
            content:
              "你是儿童编程课的创意导演。只返回 JSON，不要 Markdown，不要解释。JSON 结构必须是 {\"title\":\"作品名\",\"prompt\":\"完整提示词\"}。prompt 必须以“帮我写一个纯HTML网页。”开头，适合小学四五年级，要求有趣、安全、可在单文件 HTML 中完成，并包含至少 4 个用【】包裹的可替换词。",
          },
          {
            role: "user",
            content: `请给 ${
              body.studentClass || "某个"
            }班的${body.studentName || "学生"}现场生成一个新鲜的网页创意。不要重复计时器、盲盒、情绪站、答题页。`,
          },
        ],
      }),
    });

    if (!response.ok) {
      return Response.json(fallbackIdea);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content ?? "";
    const idea = extractJson(content);

    if (!idea?.title || !idea?.prompt) {
      return Response.json(fallbackIdea);
    }

    return Response.json({
      title: idea.title.trim().slice(0, 40),
      prompt: idea.prompt.trim(),
    });
  } catch {
    return Response.json(fallbackIdea);
  }
}
