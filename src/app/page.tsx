"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, WandSparkles } from "lucide-react";
import { classOptions } from "@/lib/classes";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [studentClass, setStudentClass] = useState(classOptions[0]);

  useEffect(() => {
    const savedName = window.localStorage.getItem("studentName");
    const savedClass = window.localStorage.getItem("studentClass");

    if (savedName && savedClass) {
      router.replace("/workbench");
    }
  }, [router]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    window.localStorage.setItem("studentName", trimmedName);
    window.localStorage.setItem("studentClass", studentClass);
    router.push("/workbench");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_20%,#ffe78f,transparent_24%),radial-gradient(circle_at_80%_10%,#9be7ff,transparent_24%),linear-gradient(135deg,#6857f6,#f072b6_48%,#28c2a0)] px-4 text-slate-950">
      <div className="absolute left-8 top-10 h-20 w-20 animate-float rounded-full bg-white/30 blur-sm" />
      <div className="absolute bottom-16 right-12 h-28 w-28 animate-float-delayed rounded-full bg-yellow-200/40 blur-md" />
      <div className="absolute inset-x-0 top-20 flex justify-center text-5xl opacity-80">
        <span className="animate-bounce-slow">✨</span>
        <span className="mx-12 animate-bounce-slower">🪄</span>
        <span className="animate-bounce-slow">🌈</span>
      </div>

      <section className="mx-auto flex min-h-screen max-w-xl items-center justify-center py-10">
        <form
          onSubmit={handleSubmit}
          className="w-full rounded-[28px] border border-white/55 bg-white/82 p-7 shadow-2xl shadow-indigo-950/20 backdrop-blur-xl sm:p-9"
        >
          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
              <WandSparkles size={30} />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-fuchsia-600">
                Vibe Coding 魔法学院
              </p>
              <h1 className="text-3xl font-black text-slate-950 sm:text-4xl">
                进入编程工作台
              </h1>
            </div>
          </div>

          <label className="mb-2 block text-sm font-bold text-slate-700">
            你的真实姓名
          </label>
          <div className="flex items-center gap-3 rounded-2xl border-2 border-indigo-100 bg-white px-4 py-3 shadow-inner focus-within:border-indigo-400">
            <Sparkles className="shrink-0 text-indigo-500" size={22} />
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none placeholder:text-slate-400"
              placeholder="🪄 魔法师，请输入你的尊姓大名（真实姓名）"
              autoFocus
            />
          </div>

          <label className="mb-2 mt-5 block text-sm font-bold text-slate-700">
            选择班级
          </label>
          <select
            value={studentClass}
            onChange={(event) => setStudentClass(event.target.value)}
            className="w-full rounded-2xl border-2 border-indigo-100 bg-white px-4 py-3 text-lg font-black text-slate-800 shadow-inner outline-none transition focus:border-indigo-400"
          >
            {classOptions.map((className) => (
              <option key={className} value={className}>
                {className} 班
              </option>
            ))}
          </select>

          <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-lg font-black text-white shadow-xl shadow-slate-950/25 transition hover:-translate-y-0.5 hover:bg-indigo-700">
            <WandSparkles size={22} />
            开始施展代码魔法
          </button>
        </form>
      </section>
    </main>
  );
}
