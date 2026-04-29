import { NextRequest } from "next/server";
import {
  DEEPSEEK_API_KEY,
  DEEPSEEK_CHAT_COMPLETIONS_URL,
  DEEPSEEK_MODEL,
} from "@/lib/deepseek";
import { extractHtmlCode } from "@/lib/html";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT =
  "你是一个幽默的高级前端魔法师。请根据小学生的需求，输出一段完整的、单文件的纯 HTML 代码（必须包含所有的 CSS 样式和 JS 逻辑）。严禁使用任何外部图片链接，请全部用 Emoji 符号代替，严禁引入外部 CSS/JS 库。代码必须且只能包裹在 ```html 和 ``` 之间。";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    studentName?: string;
    studentClass?: string;
    workTitle?: string;
    prompt?: string;
    messages?: ChatMessage[];
  };

  const studentName = body.studentName?.trim() || "匿名魔法师";
  const studentClass = body.studentClass?.trim() || "未分班";
  const workTitle = body.workTitle?.trim() || "魔法作品";
  const prompt = body.prompt?.trim();

  if (!prompt) {
    return Response.json({ error: "缺少咒语内容" }, { status: 400 });
  }

  const history = (body.messages ?? [])
    .filter((message) => message.role === "user" || message.role === "assistant")
    .slice(-8)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));

  const chatLog = await prisma.chatLog.create({
    data: {
      studentName,
      studentClass,
      workTitle,
      prompt,
      generatedCode: "",
    },
  });

  let deepseekResponse: Response;

  try {
    deepseekResponse = await fetch(DEEPSEEK_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        stream: true,
        temperature: 0.7,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...history,
          { role: "user", content: prompt },
        ],
      }),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "DeepSeek 连接失败";

    await prisma.chatLog.update({
      where: { id: chatLog.id },
      data: { generatedCode: `<!-- DeepSeek 连接失败：${message} -->` },
    });

    return Response.json(
      { error: "DeepSeek 施法失败", detail: message },
      { status: 502 },
    );
  }

  if (!deepseekResponse.ok || !deepseekResponse.body) {
    const errorText = await deepseekResponse.text();

    await prisma.chatLog.update({
      where: { id: chatLog.id },
      data: { generatedCode: `<!-- DeepSeek 施法失败：${errorText} -->` },
    });

    return Response.json(
      { error: "DeepSeek 施法失败", detail: errorText },
      { status: deepseekResponse.status || 500 },
    );
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let answer = "";
  let buffer = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = deepseekResponse.body!.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const rawLine of lines) {
            const line = rawLine.trim();

            if (!line.startsWith("data:")) {
              continue;
            }

            const data = line.replace(/^data:\s*/, "");

            if (data === "[DONE]") {
              continue;
            }

            try {
              const payload = JSON.parse(data) as {
                choices?: Array<{ delta?: { content?: string } }>;
              };
              const chunk = payload.choices?.[0]?.delta?.content ?? "";

              if (chunk) {
                answer += chunk;
                controller.enqueue(encoder.encode(chunk));
              }
            } catch {
              controller.enqueue(encoder.encode(""));
            }
          }
        }

        const generatedCode = extractHtmlCode(answer);

        await prisma.chatLog.update({
          where: { id: chatLog.id },
          data: {
            generatedCode,
          },
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "未知的魔法传输错误";
        const generatedCode = extractHtmlCode(answer);

        await prisma.chatLog.update({
          where: { id: chatLog.id },
          data: {
            generatedCode:
              generatedCode || `<!-- 施法中断：${message} -->`,
          },
        });

        controller.enqueue(encoder.encode(`\n\n施法中断：${message}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/plain; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}
