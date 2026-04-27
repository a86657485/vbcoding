"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Heart,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Send,
  Sparkles,
  Star,
  Trophy,
  WandSparkles,
  X,
} from "lucide-react";
import { classOptions } from "@/lib/classes";

type Review = {
  id: number;
  reviewerName: string;
  promptScore: number;
  functionScore: number;
  experienceScore: number;
  comment: string;
  createdAt: string;
};

type Work = {
  id: number;
  studentName: string;
  studentClass: string;
  workTitle: string;
  prompt: string;
  generatedCode: string;
  likes: number;
  createdAt: string;
  reviews: Review[];
  reviewCount: number;
  averageScore: number;
};

const avatarEmojis = ["🧙", "🪄", "🚀", "🎨", "🧠", "🌟", "🎮", "🎵", "🍀"];
const avatarGradients = [
  "from-fuchsia-500 via-rose-400 to-amber-300",
  "from-cyan-400 via-blue-500 to-violet-500",
  "from-emerald-400 via-teal-400 to-sky-400",
  "from-yellow-300 via-orange-400 to-red-400",
  "from-indigo-500 via-purple-500 to-pink-400",
];

function avatarIndex(name: string, id: number) {
  return (
    name
      .split("")
      .reduce((total, char) => total + char.charCodeAt(0), id) %
    avatarEmojis.length
  );
}

function ratingAverage(work: Work) {
  return work.averageScore ? `${work.averageScore.toFixed(1)} 分` : "待评价";
}

function ScorePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-black text-white">{label}</span>
        <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-black text-cyan-100">
          {value} / 5
        </span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className={`flex h-9 flex-1 items-center justify-center rounded-xl transition ${
              score <= value
                ? "bg-amber-300 text-slate-950"
                : "bg-white/10 text-white/50 hover:bg-white/20"
            }`}
          >
            <Star size={17} fill={score <= value ? "currentColor" : "none"} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SpacePage() {
  const router = useRouter();
  const [studentName, setStudentName] = useState("");
  const [selectedClass, setSelectedClass] = useState(classOptions[0]);
  const [works, setWorks] = useState<Work[]>([]);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [promptScore, setPromptScore] = useState(4);
  const [functionScore, setFunctionScore] = useState(4);
  const [experienceScore, setExperienceScore] = useState(4);
  const [comment, setComment] = useState("");
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    const savedName = window.localStorage.getItem("studentName");
    const savedClass = window.localStorage.getItem("studentClass");
    const classFromUrl = new URLSearchParams(window.location.search).get("class");

    if (!savedName || !savedClass) {
      router.replace("/");
      return;
    }

    setStudentName(savedName);
    setSelectedClass(
      classFromUrl && classOptions.includes(classFromUrl)
        ? classFromUrl
        : savedClass,
    );
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();

    setIsLoading(true);

    const query = `?studentClass=${encodeURIComponent(selectedClass)}`;

    fetch(`/api/works${query}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => setWorks(data.works ?? []))
      .catch((error) => {
        if (error.name !== "AbortError") {
          setWorks([]);
        }
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [refreshIndex, selectedClass]);

  useEffect(() => {
    if (!selectedWork) {
      return;
    }

    const latest = works.find((work) => work.id === selectedWork.id);

    if (latest) {
      setSelectedWork(latest);
    }
  }, [works, selectedWork]);

  const topWorks = useMemo(() => works.slice(0, 3), [works]);
  const groupedStudents = useMemo(() => {
    const groups = new Map<string, Work[]>();

    for (const work of works) {
      groups.set(work.studentName, [...(groups.get(work.studentName) ?? []), work]);
    }

    return Array.from(groups.entries()).map(([name, studentWorks]) => ({
      name,
      works: studentWorks,
      likes: studentWorks.reduce((total, work) => total + work.likes, 0),
      bestScore: Math.max(0, ...studentWorks.map((work) => work.averageScore)),
    }));
  }, [works]);

  function switchClass(className: string) {
    setSelectedClass(className);
    setSelectedWork(null);
    const nextUrl = `/space?class=${className}`;
    window.history.replaceState(null, "", nextUrl);
  }

  async function likeWork(work: Work) {
    const response = await fetch(`/api/works/${work.id}/like`, {
      method: "POST",
    });

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as { work: { likes: number } };

    setWorks((current) =>
      current.map((item) =>
        item.id === work.id ? { ...item, likes: data.work.likes } : item,
      ),
    );
  }

  async function submitReview() {
    if (!selectedWork) {
      return;
    }

    setIsSubmittingReview(true);

    try {
      const response = await fetch(`/api/works/${selectedWork.id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewerName: studentName,
          promptScore,
          functionScore,
          experienceScore,
          comment,
        }),
      });

      if (!response.ok) {
        return;
      }

      setComment("");
      setRefreshIndex((current) => current + 1);
    } finally {
      setIsSubmittingReview(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#10141f] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(120deg,rgba(34,211,238,0.14),transparent_34%,rgba(251,191,36,0.14)_68%,transparent),linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:100%_100%,48px_48px,48px_48px]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-amber-300" />

      <section className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/workbench")}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
              title="返回工作台"
            >
              <ArrowLeft size={21} />
            </button>
            <div>
              <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.24em] text-cyan-200">
                <Sparkles size={16} />
                Student Creation Space
              </p>
              <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
                {selectedClass} 班体验空间
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setRefreshIndex((current) => current + 1)}
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black backdrop-blur transition hover:bg-white/20"
            >
              <RefreshCw size={18} />
              刷新展厅
            </button>
            <div className="rounded-2xl border border-cyan-200/20 bg-cyan-300/10 px-4 py-3 text-sm font-black text-cyan-100">
              {studentName} 评审官
            </div>
          </div>
        </header>

        <section className="mb-6 overflow-x-auto pb-2">
          <div className="flex gap-2">
            {classOptions.map((className) => (
              <button
                key={className}
                onClick={() => switchClass(className)}
                className={`min-w-24 rounded-2xl px-4 py-3 text-sm font-black transition ${
                  selectedClass === className
                    ? "bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-400/20"
                    : "border border-white/10 bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {className} 班
              </button>
            ))}
          </div>
        </section>

        <section className="mb-6 grid gap-3 md:grid-cols-3">
          {topWorks.map((work, index) => (
            <div
              key={work.id}
              className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur"
            >
              <div className="mb-2 flex items-center gap-2 text-sm font-black text-amber-200">
                <Trophy size={18} />
                展厅第 {index + 1} 名
              </div>
              <p className="truncate text-lg font-black">{work.workTitle}</p>
              <p className="text-sm font-semibold text-white/60">
                {work.studentClass}班 · {work.studentName} · {work.likes} 赞 ·{" "}
                {ratingAverage(work)}
              </p>
            </div>
          ))}
        </section>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center gap-3 text-lg font-black text-cyan-100">
            <Loader2 className="animate-spin" />
            正在开启体验空间...
          </div>
        ) : works.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-[32px] border border-dashed border-white/20 bg-white/10 p-8 text-center">
            <div>
              <WandSparkles className="mx-auto mb-4 text-cyan-200" size={48} />
              <h2 className="text-2xl font-black">展厅还在等待第一件作品</h2>
              <p className="mt-2 text-sm font-semibold text-white/60">
                回到工作台生成一个完整 HTML 作品后，它会自动来到这里。
              </p>
            </div>
          </div>
        ) : (
          <section className="space-y-6 pb-8">
            {groupedStudents.map((student, studentIndex) => (
              <section
                key={student.name}
                className="rounded-[32px] border border-white/10 bg-white/10 p-4 backdrop-blur"
              >
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br ${
                        avatarGradients[studentIndex % avatarGradients.length]
                      } text-3xl shadow-xl shadow-black/25`}
                    >
                      {
                        avatarEmojis[
                          avatarIndex(student.name, student.works[0]?.id ?? 0)
                        ]
                      }
                    </div>
                    <div>
                      <h2 className="text-2xl font-black">{student.name}</h2>
                      <p className="text-sm font-bold text-cyan-100">
                        {selectedClass} 班 · {student.works.length} 件作品 ·{" "}
                        {student.likes} 赞 ·{" "}
                        {student.bestScore ? `${student.bestScore.toFixed(1)} 分` : "待评价"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {student.works.map((work, index) => {
                    const avatar = avatarIndex(work.studentName, work.id);
                    const gradient =
                      avatarGradients[(index + studentIndex) % avatarGradients.length];

                    return (
                      <button
                        key={work.id}
                        onClick={() => setSelectedWork(work)}
                        className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-black/20 p-5 text-left shadow-2xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-cyan-200/50 hover:bg-white/10"
                      >
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-amber-300" />
                        <div className="mb-5 flex items-center justify-between gap-3">
                          <div
                            className={`flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br ${gradient} text-3xl shadow-xl shadow-black/25 transition group-hover:scale-105`}
                          >
                            {avatarEmojis[avatar]}
                          </div>
                          <div className="rounded-2xl bg-black/25 px-3 py-2 text-right">
                            <p className="text-xs font-bold text-white/50">LIKE</p>
                            <p className="flex items-center gap-1 text-xl font-black text-rose-200">
                              <Heart size={18} fill="currentColor" />
                              {work.likes}
                            </p>
                          </div>
                        </div>

                        <h3 className="line-clamp-2 text-xl font-black leading-tight">
                          {work.workTitle}
                        </h3>
                        <div className="mt-4 flex items-center justify-between gap-2 text-xs font-black text-white/60">
                          <span>{ratingAverage(work)}</span>
                          <span>{work.reviewCount} 条评价</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </section>
        )}
      </section>

      {selectedWork && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm">
          <section className="grid h-[92vh] w-full max-w-7xl overflow-hidden rounded-[28px] border border-white/10 bg-[#161b29] shadow-2xl lg:grid-cols-[380px_1fr]">
            <aside className="magic-scrollbar min-h-0 overflow-y-auto border-r border-white/10 p-5">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-cyan-200">
                    {selectedWork.studentClass}班 · {selectedWork.studentName} 的作品
                  </p>
                  <h2 className="mt-1 text-2xl font-black">
                    {selectedWork.workTitle}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedWork(null)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white/20"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-4 rounded-2xl border border-white/10 bg-white/10 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-black text-amber-200">
                  <MessageSquareText size={17} />
                  原始提示词
                </div>
                <p className="text-sm font-semibold leading-7 text-white/70">
                  {selectedWork.prompt}
                </p>
              </div>

              <div className="mb-4 grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-white/10 p-3 text-center">
                  <p className="text-xs font-bold text-white/50">点赞</p>
                  <p className="text-xl font-black text-rose-200">
                    {selectedWork.likes}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 text-center">
                  <p className="text-xs font-bold text-white/50">评分</p>
                  <p className="text-xl font-black text-amber-200">
                    {ratingAverage(selectedWork)}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 text-center">
                  <p className="text-xs font-bold text-white/50">评价</p>
                  <p className="text-xl font-black text-cyan-200">
                    {selectedWork.reviewCount}
                  </p>
                </div>
              </div>

              <button
                onClick={() => likeWork(selectedWork)}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 px-4 py-3 font-black text-white transition hover:bg-rose-400"
              >
                <Heart size={19} fill="currentColor" />
                给这个作品点赞
              </button>

              <div className="space-y-3">
                <ScorePicker
                  label="提示词"
                  value={promptScore}
                  onChange={setPromptScore}
                />
                <ScorePicker
                  label="作品功能完整度"
                  value={functionScore}
                  onChange={setFunctionScore}
                />
                <ScorePicker
                  label="作品体验感"
                  value={experienceScore}
                  onChange={setExperienceScore}
                />
              </div>

              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                className="mt-3 h-24 w-full resize-none rounded-2xl border border-white/10 bg-white/10 p-3 text-sm font-semibold text-white outline-none placeholder:text-white/30 focus:border-cyan-200/60"
                placeholder="留一句鼓励或建议（可选）"
                maxLength={160}
              />

              <button
                onClick={submitReview}
                disabled={isSubmittingReview}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/50"
              >
                {isSubmittingReview ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
                提交评价
              </button>

              <div className="mt-5 space-y-3">
                {selectedWork.reviews.slice(0, 3).map((review) => (
                  <div
                    key={review.id}
                    className="rounded-2xl border border-white/10 bg-white/10 p-3"
                  >
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <span className="font-black text-white">
                        {review.reviewerName}
                      </span>
                      <span className="text-xs font-black text-amber-200">
                        {(
                          (review.promptScore +
                            review.functionScore +
                            review.experienceScore) /
                          3
                        ).toFixed(1)}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white/60">
                      {review.comment || "给作品点亮了一颗星。"}
                    </p>
                  </div>
                ))}
              </div>
            </aside>

            <div className="min-h-0 bg-white">
              <iframe
                title={`${selectedWork.workTitle} 作品预览`}
                srcDoc={selectedWork.generatedCode}
                sandbox="allow-scripts allow-forms allow-modals"
                className="h-full min-h-[520px] w-full border-0 bg-white"
              />
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
