"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Code2,
  Download,
  Eye,
  Loader2,
  LogOut,
  Play,
  Send,
  Sparkles,
  WandSparkles,
} from "lucide-react";

type Role = "user" | "assistant";

type Message = {
  id: string;
  role: Role;
  content: string;
};

type TemplateIdea = {
  title: string;
  prompt: string;
  accent: string;
};

const accentOptions = [
  "from-fuchsia-500 to-cyan-400",
  "from-emerald-500 to-lime-300",
  "from-sky-500 to-rose-300",
  "from-violet-500 to-amber-300",
  "from-amber-300 to-teal-400",
];

const fallbackTemplates: TemplateIdea[] = [
  {
    title: "✨ AI 现场灵感",
    prompt:
      "帮我写一个纯HTML网页。\n\n【网页主题】：创意灵感按钮\n【目标用户】：小学四五年级学生\n【核心功能】：点击按钮随机生成【未来发明、校园挑战、魔法任务】三个创意灵感\n【页面结构】：标题区、灵感卡片、生成按钮、收藏按钮\n【互动规则】：每次点击按钮都会切换新的灵感内容和 Emoji 装饰\n【视觉风格】：【未来实验室风】\n【互动特效】：出现【按钮发光、卡片翻转、星星粒子动画】\n【限制要求】：必须是单文件 HTML，CSS 和 JS 都写在同一个文件里，不使用外部图片和外部库，用 Emoji 做装饰。",
    accent: "from-amber-300 to-cyan-400",
  },
  {
    title: "📅 自律打卡墙",
    prompt:
      "帮我写一个纯HTML网页。\n\n【网页主题】：自律打卡墙\n【目标用户】：小学四五年级学生\n【核心功能】：记录【背单词、跳绳、阅读、整理书包】每日打卡\n【页面结构】：标题区、任务按钮、连续天数、鼓励语、打卡日历\n【互动规则】：点击任务后点亮当天格子，并显示鼓励语\n【视觉风格】：【清爽手账风】\n【互动特效】：打卡成功出现【印章盖下、彩带飘出、星星闪烁动画】\n【限制要求】：必须是单文件 HTML，CSS 和 JS 都写在同一个文件里，不使用外部图片和外部库，用 Emoji 做装饰。",
    accent: "from-fuchsia-500 to-cyan-400",
  },
  {
    title: "🎨 头像制造机",
    prompt:
      "帮我写一个纯HTML网页。\n\n【网页主题】：头像制造机\n【目标用户】：小学四五年级学生\n【核心功能】：随机组合【表情、发型、配饰、背景色】生成专属 Emoji 头像\n【页面结构】：标题区、头像预览区、随机按钮、保存提示区\n【互动规则】：点击按钮后头像元素随机变化，并显示一句个性签名\n【视觉风格】：【潮流贴纸风】\n【互动特效】：切换时出现【贴纸弹跳、背景渐变、闪粉动画】\n【限制要求】：必须是单文件 HTML，CSS 和 JS 都写在同一个文件里，不使用外部图片和外部库，用 Emoji 做装饰。",
    accent: "from-emerald-500 to-lime-300",
  },
  {
    title: "🎲 今天吃什么",
    prompt:
      "帮我写一个纯HTML网页。\n\n【网页主题】：今天吃什么转盘\n【目标用户】：小学四五年级学生\n【核心功能】：点击按钮随机抽取【米饭、面条、汉堡、水果沙拉】等午餐灵感\n【页面结构】：标题区、转盘区、开始按钮、结果卡片、再来一次按钮\n【互动规则】：点击开始后转盘旋转，停止后显示结果和一句开心推荐语\n【视觉风格】：【可爱美食风】\n【互动特效】：抽中后出现【转盘旋转、食物 Emoji 飞出、彩色泡泡动画】\n【限制要求】：必须是单文件 HTML，CSS 和 JS 都写在同一个文件里，不使用外部图片和外部库，用 Emoji 做装饰。",
    accent: "from-sky-500 to-rose-300",
  },
  {
    title: "🔤 单词学习机",
    prompt:
      "帮我写一个纯HTML网页。\n\n【网页主题】：单词学习机\n【目标用户】：小学四五年级学生\n【核心功能】：展示一组【动物、食物、运动、天气】主题英语单词卡片\n【页面结构】：标题区、单词卡片区、中文意思区、例句区、下一个按钮、记住了按钮\n【互动规则】：点击下一个按钮切换单词；点击记住了按钮给当前单词加星标；点击卡片可以在【英文单词】和【中文意思】之间翻转\n【视觉风格】：【明亮校园风】\n【学习特效】：切换单词时出现【卡片翻转、星星鼓励、进度条增长动画】\n【限制要求】：必须是单文件 HTML，CSS 和 JS 都写在同一个文件里，不使用外部图片和外部库，用 Emoji 做装饰。",
    accent: "from-violet-500 to-amber-300",
  },
];

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function extractHtmlCode(text: string) {
  const match = text.match(/```html\s*([\s\S]*?)```/i);
  return match?.[1]?.trim() ?? "";
}

function deriveWorkTitle(prompt: string) {
  const themeMatch = prompt.match(/【网页主题】[:：]?\s*([^\n。]+)/);

  if (themeMatch?.[1]?.trim()) {
    return themeMatch[1].trim().slice(0, 24);
  }

  const firstLine = prompt
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line && line !== "帮我写一个纯HTML网页。");

  if (firstLine) {
    return firstLine.replace(/^[-*]\s*/, "").slice(0, 24);
  }

  return "魔法作品";
}

const emptyPreview = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, #e0f2fe, #fef3c7);
      font-family: Arial, "Microsoft YaHei", sans-serif;
      color: #0f172a;
    }
    main { text-align: center; padding: 24px; }
    .emoji { font-size: 72px; }
  </style>
</head>
<body>
  <main>
    <div class="emoji">🪄</div>
    <h1>魔法预览区待命中</h1>
    <p>选择一个案例模板，或者直接输入自己的提示词，再点击发送。</p>
  </main>
</body>
</html>`;

export default function WorkbenchPage() {
  const router = useRouter();
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [templateIdeas, setTemplateIdeas] =
    useState<TemplateIdea[]>(fallbackTemplates);
  const [prompt, setPrompt] = useState(fallbackTemplates[0].prompt);
  const [workTitle, setWorkTitle] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingIdea, setIsGeneratingIdea] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [previewKey, setPreviewKey] = useState(0);
  const [chatHeight, setChatHeight] = useState(320);
  const [isPromptEditorExpanded, setIsPromptEditorExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);
  const resizeStartRef = useRef<{ y: number; height: number } | null>(null);

  const srcDoc = generatedCode || emptyPreview;

  useEffect(() => {
    const savedName = window.localStorage.getItem("studentName");
    const savedClass = window.localStorage.getItem("studentClass");

    if (!savedName || !savedClass) {
      router.replace("/");
      return;
    }

    setStudentName(savedName);
    setStudentClass(savedClass);
  }, [router]);

  useEffect(() => {
    if (!studentName || !studentClass) {
      return;
    }

    void generateLiveIdea();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentName, studentClass]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  function logout() {
    window.localStorage.removeItem("studentName");
    window.localStorage.removeItem("studentClass");
    router.push("/");
  }

  function openSpaceInNewTab() {
    const nextUrl = `/space?class=${encodeURIComponent(studentClass)}`;
    window.open(nextUrl, "_blank", "noopener,noreferrer");
  }

  function handleTemplateClick(templatePrompt: string) {
    setPrompt(templatePrompt);
    setIsPromptEditorExpanded(true);
    window.requestAnimationFrame(() => {
      promptInputRef.current?.focus();
      promptInputRef.current?.setSelectionRange(
        0,
        promptInputRef.current.value.length,
      );
    });
  }

  function startResize(event: React.PointerEvent<HTMLDivElement>) {
    resizeStartRef.current = {
      y: event.clientY,
      height: chatHeight,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function resizeChat(event: React.PointerEvent<HTMLDivElement>) {
    if (!resizeStartRef.current) {
      return;
    }

    const delta = event.clientY - resizeStartRef.current.y;
    const nextHeight = resizeStartRef.current.height + delta;

    setChatHeight(Math.min(560, Math.max(180, nextHeight)));
  }

  function stopResize(event: React.PointerEvent<HTMLDivElement>) {
    resizeStartRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  async function generateLiveIdea() {
    if (isGeneratingIdea) {
      return;
    }

    setIsGeneratingIdea(true);

    try {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentName,
          studentClass,
        }),
      });
      const data = (await response.json()) as {
        ideas?: Array<{ title?: string; prompt?: string }>;
      };
      const nextIdeas = (data.ideas?.length ? data.ideas : fallbackTemplates)
        .slice(0, 5)
        .map((idea, index) => ({
          title: idea.title || fallbackTemplates[index]?.title || "✨ 创意选项",
          prompt:
            idea.prompt ||
            fallbackTemplates[index]?.prompt ||
            fallbackTemplates[0].prompt,
          accent: accentOptions[index % accentOptions.length],
        }));
      const firstIdea = nextIdeas[0];

      setTemplateIdeas(nextIdeas);
      setPrompt(firstIdea.prompt);
      setIsPromptEditorExpanded(true);
    } finally {
      setIsGeneratingIdea(false);
    }
  }

  async function sendPrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentPrompt = prompt.trim();
    const currentWorkTitle = workTitle.trim() || deriveWorkTitle(currentPrompt);

    if (isLoading || !currentPrompt) {
      return;
    }
    setIsPromptEditorExpanded(false);
    setWorkTitle(currentWorkTitle);

    const userMessage: Message = {
      id: createId(),
      role: "user",
      content: currentPrompt,
    };
    const assistantId = createId();
    const assistantMessage: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
    };
    const previousMessages = messages.slice(-8);

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setIsLoading(true);
    setActiveTab("preview");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentName,
          studentClass,
          workTitle: currentWorkTitle,
          prompt: currentPrompt,
          messages: previousMessages.map(({ role, content }) => ({
            role,
            content,
          })),
        }),
      });

      if (!response.ok || !response.body) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error ?? "DeepSeek 没有返回魔法能量");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        answer += chunk;

        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? { ...message, content: answer }
              : message,
          ),
        );

        const html = extractHtmlCode(answer);

        if (html) {
          setGeneratedCode(html);
          setActiveTab("preview");
        }
      }

      const finalHtml = extractHtmlCode(answer);

      if (finalHtml) {
        setGeneratedCode(finalHtml);
        setActiveTab("preview");
        setPreviewKey((current) => current + 1);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "施法失败，请稍后再试。";

      setMessages((current) =>
        current.map((item) =>
          item.id === assistantId
            ? { ...item, content: `施法失败：${message}` }
            : item,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  function downloadHtml() {
    if (!generatedCode) {
      return;
    }

    const blob = new Blob([generatedCode], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${studentName || "student"}-magic-work.html`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden">
      <header className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2 shadow-sm lg:h-16 lg:px-6 lg:py-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <WandSparkles size={22} />
          </div>
          <div>
            <h1 className="text-base font-black leading-tight sm:text-lg">
              Vibe Coding 魔法工作台
            </h1>
            <p className="text-xs font-semibold text-slate-500">
              纯 HTML 创作课
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openSpaceInNewTab}
            className="hidden rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:bg-indigo-700 sm:block"
          >
            进入体验空间
          </button>
          <div className="hidden rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 sm:block">
            {studentClass}班 · 你好，{studentName}魔法师
          </div>
          <button
            onClick={logout}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100"
            title="退出"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <section className="flex flex-col lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[40%_60%] lg:overflow-hidden">
        <aside className="flex flex-col border-r border-slate-200 bg-white lg:min-h-0 lg:overflow-hidden">
          <div className="shrink-0 border-b border-slate-200 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700">
              <Sparkles size={18} className="text-fuchsia-500" />
              魔法咒语书
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={generateLiveIdea}
                disabled={isGeneratingIdea}
                className="flex h-12 min-w-[168px] items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-slate-950 px-4 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-wait"
              >
                {isGeneratingIdea ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Sparkles size={18} />
                )}
                {isGeneratingIdea ? "生成中..." : "换一组灵感"}
              </button>
              {templateIdeas.map((template) => (
                <button
                key={template.title}
                onClick={() => handleTemplateClick(template.prompt)}
                className="relative h-12 min-w-[150px] overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 text-left text-sm font-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${template.accent}`}
                  />
                  {template.title}
                </button>
              ))}
            </div>
          </div>

          <div
            ref={scrollRef}
            style={{ height: chatHeight }}
            className="magic-scrollbar min-h-0 shrink-0 space-y-4 overflow-y-auto bg-slate-50 p-4 lg:flex-1"
          >
            {messages.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-center text-sm font-semibold text-slate-500">
                点一个案例模板直接写，或者自己输入完整提示词，都可以开始生成网页。
              </div>
            )}

            {messages.map((message) => (
              <article
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm ${
                    message.role === "user"
                      ? "bg-emerald-500 text-white"
                      : "border border-blue-100 bg-blue-50 text-slate-800"
                  }`}
                >
                  <div className="mb-1 flex items-center gap-2 text-xs font-black opacity-80">
                    {message.role === "user" ? (
                      "你发出的咒语"
                    ) : (
                      <>
                        <Bot size={15} />
                        DeepSeek 前端魔法师
                      </>
                    )}
                  </div>
                  <pre className="whitespace-pre-wrap break-words font-sans">
                    {message.content ||
                      (message.role === "assistant" &&
                        "DeepSeek 正在施展魔法...")}
                  </pre>
                </div>
              </article>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-sm font-bold text-blue-600">
                <Loader2 size={18} className="animate-spin" />
                DeepSeek 正在施展魔法...
              </div>
            )}
          </div>

          <div
            role="separator"
            aria-label="调整聊天记录高度"
            onPointerDown={startResize}
            onPointerMove={resizeChat}
            onPointerUp={stopResize}
            onPointerCancel={stopResize}
            className="group flex h-4 shrink-0 cursor-row-resize items-center justify-center border-y border-slate-200 bg-white transition hover:bg-indigo-50"
            title="上下拖动调整聊天记录高度"
          >
            <div className="h-1 w-16 rounded-full bg-slate-300 transition group-hover:bg-indigo-400" />
          </div>

          <form
            onSubmit={sendPrompt}
            className="shrink-0 border-t border-slate-200 p-3"
          >
            <label className="mb-2 block">
              <span className="mb-1 block text-xs font-black text-slate-500">
                作品名（可不填）
              </span>
              <input
                value={workTitle}
                onChange={(event) => setWorkTitle(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                placeholder="可以自己起名；不填会按你真正输入的提示词自动命名"
              />
            </label>
            <textarea
              ref={promptInputRef}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              className={`magic-scrollbar w-full resize-y overflow-auto rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold leading-6 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 ${
                isPromptEditorExpanded
                  ? "max-h-[520px] min-h-[260px]"
                  : "h-32 min-h-[128px]"
              }`}
              placeholder="可以直接输入自己的完整提示词，也可以先点上面的案例模板再修改。"
            />
            <button
              disabled={isLoading || !prompt.trim()}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 font-black text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isLoading ? (
                <Loader2 size={19} className="animate-spin" />
              ) : (
                <Send size={19} />
              )}
              发送咒语
            </button>
            <button
              type="button"
              onClick={openSpaceInNewTab}
              className="mt-2 flex w-full items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-black text-indigo-700 transition hover:bg-indigo-100 sm:hidden"
            >
              进入体验空间
            </button>
          </form>
        </aside>

        <section className="flex h-[560px] flex-col bg-[#eef3f8] sm:h-[640px] lg:h-auto lg:min-h-0 lg:overflow-hidden">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white p-3">
            <div className="flex rounded-2xl bg-slate-100 p-1">
              <button
                onClick={() => setActiveTab("preview")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition ${
                  activeTab === "preview"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                <Eye size={17} />
                👁️ 魔法预览
              </button>
              <button
                onClick={() => setActiveTab("code")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition ${
                  activeTab === "code"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                <Code2 size={17} />
                💻 源代码
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={downloadHtml}
                disabled={!generatedCode}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                <Download size={17} />
                📥 保存作品
              </button>
              <button
                onClick={() => setPreviewKey((current) => current + 1)}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-black text-white transition hover:bg-indigo-700"
              >
                <Play size={17} />
                🔄 重新运行
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden p-4">
            {activeTab === "preview" ? (
              <iframe
                key={previewKey}
                title="魔法预览"
                srcDoc={srcDoc}
                sandbox="allow-scripts allow-forms allow-modals"
                className="h-full min-h-0 w-full rounded-2xl border border-slate-200 bg-white shadow-sm"
              />
            ) : (
              <pre className="magic-scrollbar h-full min-h-0 overflow-auto rounded-2xl border border-slate-200 bg-slate-950 p-5 text-sm leading-7 text-emerald-200 shadow-sm">
                <code>{generatedCode || "生成出的 HTML 源代码会出现在这里。"}</code>
              </pre>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
