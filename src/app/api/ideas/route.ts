import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = "deepseek-v4-pro";
const DEEPSEEK_API_KEY = "sk-eb65e011c69a4e1cb667eecdfce990a8";

const fallbackIdeas = [
  {
    title: "✨ AI 现场灵感",
    prompt:
      "帮我写一个纯HTML网页。\n\n【网页主题】：创意灵感按钮\n【目标用户】：小学四五年级学生\n【核心功能】：点击按钮随机生成【未来发明、校园挑战、魔法任务】三个创意灵感\n【页面结构】：标题区、灵感卡片、生成按钮、收藏按钮\n【互动规则】：每次点击按钮都会切换新的灵感内容和 Emoji 装饰\n【视觉风格】：【未来实验室风】\n【互动特效】：出现【按钮发光、卡片翻转、星星粒子动画】\n【限制要求】：必须是单文件 HTML，CSS 和 JS 都写在同一个文件里，不使用外部图片和外部库，用 Emoji 做装饰。",
  },
  {
    title: "📅 自律打卡墙",
    prompt:
      "帮我写一个纯HTML网页。\n\n【网页主题】：自律打卡墙\n【目标用户】：小学四五年级学生\n【核心功能】：记录【背单词、跳绳、阅读、整理书包】每日打卡\n【页面结构】：标题区、任务按钮、连续天数、鼓励语、打卡日历\n【互动规则】：点击任务后点亮当天格子，并显示鼓励语\n【视觉风格】：【清爽手账风】\n【互动特效】：打卡成功出现【印章盖下、彩带飘出、星星闪烁动画】\n【限制要求】：必须是单文件 HTML，CSS 和 JS 都写在同一个文件里，不使用外部图片和外部库，用 Emoji 做装饰。",
  },
  {
    title: "🎨 头像制造机",
    prompt:
      "帮我写一个纯HTML网页。\n\n【网页主题】：头像制造机\n【目标用户】：小学四五年级学生\n【核心功能】：随机组合【表情、发型、配饰、背景色】生成专属 Emoji 头像\n【页面结构】：标题区、头像预览区、随机按钮、保存提示区\n【互动规则】：点击按钮后头像元素随机变化，并显示一句个性签名\n【视觉风格】：【潮流贴纸风】\n【互动特效】：切换时出现【贴纸弹跳、背景渐变、闪粉动画】\n【限制要求】：必须是单文件 HTML，CSS 和 JS 都写在同一个文件里，不使用外部图片和外部库，用 Emoji 做装饰。",
  },
  {
    title: "🔤 单词学习机",
    prompt:
      "帮我写一个纯HTML网页。\n\n【网页主题】：单词学习机\n【目标用户】：小学四五年级学生\n【核心功能】：展示一组【动物、食物、运动、天气】主题英语单词卡片\n【页面结构】：标题区、单词卡片区、中文意思区、例句区、下一个按钮、记住了按钮\n【互动规则】：点击下一个按钮切换单词；点击记住了按钮给当前单词加星标；点击卡片可以在【英文单词】和【中文意思】之间翻转\n【视觉风格】：【明亮校园风】\n【学习特效】：切换单词时出现【卡片翻转、星星鼓励、进度条增长动画】\n【限制要求】：必须是单文件 HTML，CSS 和 JS 都写在同一个文件里，不使用外部图片和外部库，用 Emoji 做装饰。",
  },
  {
    title: "🎲 今天吃什么",
    prompt:
      "帮我写一个纯HTML网页。\n\n【网页主题】：今天吃什么转盘\n【目标用户】：小学四五年级学生\n【核心功能】：点击按钮随机抽取【米饭、面条、汉堡、水果沙拉】等午餐灵感\n【页面结构】：标题区、转盘区、开始按钮、结果卡片、再来一次按钮\n【互动规则】：点击开始后转盘旋转，停止后显示结果和一句开心推荐语\n【视觉风格】：【可爱美食风】\n【互动特效】：抽中后出现【转盘旋转、食物 Emoji 飞出、彩色泡泡动画】\n【限制要求】：必须是单文件 HTML，CSS 和 JS 都写在同一个文件里，不使用外部图片和外部库，用 Emoji 做装饰。",
  },
];

function extractJsonArray(text: string) {
  const match = text.match(/\[[\s\S]*\]/);

  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[0]) as Array<{ title?: string; prompt?: string }>;
  } catch {
    return null;
  }
}

function normalizeIdeas(ideas: Array<{ title?: string; prompt?: string }>) {
  const validIdeas = ideas
    .filter((idea) => idea.title?.trim() && idea.prompt?.trim())
    .slice(0, 5)
    .map((idea) => ({
      title: idea.title!.trim().slice(0, 32),
      prompt: idea.prompt!.trim(),
    }));

  if (validIdeas.length < 5) {
    return fallbackIdeas;
  }

  return validIdeas;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    studentName?: string;
    studentClass?: string;
  };
  const seed = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  try {
    const response = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        temperature: 1,
        messages: [
          {
            role: "system",
            content:
              "你是儿童编程课的创意导演。只返回 JSON 数组，不要 Markdown，不要解释。数组必须刚好 5 项，每项结构是 {\"title\":\"带 Emoji 的短标题\",\"prompt\":\"完整结构化提示词\"}。第 1 项必须是 AI 现场灵感。第 2-5 项参考抖音、小红书常见热门小应用方向，如打卡、生成器、测一测、头像/壁纸、学习工具、转盘、清单、抽签、情绪疗愈、效率工具，但不要照搬具体平台内容。每个 prompt 必须以“帮我写一个纯HTML网页。”开头，适合小学四五年级，必须包含【网页主题】【目标用户】【核心功能】【页面结构】【互动规则】【视觉风格】【互动特效】【限制要求】，并包含至少 5 个用【】包裹的可替换词。要求安全、积极、能用单文件 HTML 完成。",
          },
          {
            role: "user",
            content: `给 ${
              body.studentClass || "某个"
            }班的${body.studentName || "学生"}生成 5 个彼此差异明显的网页小应用选项。随机种子：${seed}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      return Response.json({ ideas: fallbackIdeas });
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content ?? "";
    const ideas = extractJsonArray(content);

    return Response.json({
      ideas: ideas ? normalizeIdeas(ideas) : fallbackIdeas,
    });
  } catch {
    return Response.json({ ideas: fallbackIdeas });
  }
}
