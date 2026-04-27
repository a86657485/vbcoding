"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  LayoutDashboard,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { classOptions } from "@/lib/classes";

type ChatLog = {
  id: number;
  studentName: string;
  studentClass: string;
  workTitle: string;
  prompt: string;
  generatedCode: string;
  likes: number;
  reviewCount: number;
  averageScore: number;
  createdAt: string;
};

export default function AdminPage() {
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("全部");
  const [selectedLog, setSelectedLog] = useState<ChatLog | null>(null);
  const [selectedPromptLog, setSelectedPromptLog] = useState<ChatLog | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const query = search.trim()
      ? `?studentName=${encodeURIComponent(search.trim())}`
      : "";
    const classQuery =
      selectedClass !== "全部"
        ? `${query ? "&" : "?"}studentClass=${encodeURIComponent(selectedClass)}`
        : "";

    setIsLoading(true);

    fetch(`/api/logs${query}${classQuery}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => setLogs(data.logs ?? []))
      .catch((error) => {
        if (error.name !== "AbortError") {
          setLogs([]);
        }
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [search, selectedClass, refreshIndex]);

  const totalCount = useMemo(() => logs.length, [logs]);

  async function clearAllLogs() {
    const confirmed = window.confirm(
      "确定要清空所有学生提交记录吗？这个操作不能撤销。",
    );

    if (!confirmed) {
      return;
    }

    setIsClearing(true);

    try {
      const response = await fetch("/api/logs", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("清空失败");
      }

      setSelectedLog(null);
      setLogs([]);
      setRefreshIndex((current) => current + 1);
    } finally {
      setIsClearing(false);
    }
  }

  async function deleteOneLog(log: ChatLog) {
    const confirmed = window.confirm(
      `确定删除 ${log.studentClass}班 ${log.studentName} 的《${log.workTitle}》吗？这个操作不能撤销。`,
    );

    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/logs/${log.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      window.alert("删除失败，请刷新后再试。");
      return;
    }

    if (selectedLog?.id === log.id) {
      setSelectedLog(null);
    }

    setLogs((current) => current.filter((item) => item.id !== log.id));
  }

  return (
    <main className="grid min-h-screen grid-cols-1 bg-slate-100 text-slate-950 md:grid-cols-[240px_1fr]">
      <aside className="border-r border-slate-200 bg-slate-950 p-5 text-white">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400 text-slate-950">
            <LayoutDashboard size={22} />
          </div>
          <div>
            <h1 className="text-lg font-black">教师控制台</h1>
            <p className="text-xs font-semibold text-slate-400">上帝视角</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white/10 p-4">
          <p className="text-sm font-semibold text-slate-300">当前记录</p>
          <p className="mt-2 text-4xl font-black text-cyan-300">{totalCount}</p>
        </div>
      </aside>

      <section className="min-w-0 p-4 sm:p-6">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-black">学生作品日志</h2>
            <p className="text-sm font-semibold text-slate-500">
              可按学生姓名搜索，并直接运行生成结果。
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:max-w-3xl sm:flex-row">
            <select
              value={selectedClass}
              onChange={(event) => setSelectedClass(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm outline-none sm:w-32"
            >
              <option value="全部">全部班级</option>
              {classOptions.map((className) => (
                <option key={className} value={className}>
                  {className} 班
                </option>
              ))}
              <option value="未分班">未分班</option>
            </select>
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <Search size={18} className="text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="按学生姓名搜索"
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
              />
            </label>
            <button
              onClick={() => setRefreshIndex((current) => current + 1)}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <RefreshCw size={18} />
              )}
              查看最新数据
            </button>
            <button
              onClick={clearAllLogs}
              disabled={isClearing || isLoading}
              className="flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-black text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              {isClearing ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Trash2 size={18} />
              )}
              清空所有数据
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1160px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">班级</th>
                  <th className="px-4 py-3">学生姓名</th>
                  <th className="px-4 py-3">作品名</th>
                  <th className="px-4 py-3">操作时间</th>
                  <th className="px-4 py-3">点赞数</th>
                  <th className="px-4 py-3">评价</th>
                  <th className="px-4 py-3">输入的提示词</th>
                  <th className="px-4 py-3">生成结果</th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="align-top hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-cyan-50 px-3 py-1 font-black text-cyan-700">
                        {log.studentClass} 班
                      </span>
                    </td>
                    <td className="px-4 py-4 font-black text-slate-900">
                      {log.studentName}
                    </td>
                    <td className="max-w-[180px] px-4 py-4 font-black text-indigo-700">
                      <p className="line-clamp-2">{log.workTitle}</p>
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-600">
                      {new Date(log.createdAt).toLocaleString("zh-CN")}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-rose-50 px-3 py-1 font-black text-rose-600">
                        {log.likes} 赞
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-amber-50 px-3 py-1 font-black text-amber-700">
                        {log.averageScore ? `${log.averageScore} 分` : "待评价"}
                      </span>
                      <p className="mt-1 text-xs font-semibold text-slate-400">
                        {log.reviewCount} 条
                      </p>
                    </td>
                    <td className="max-w-[320px] px-4 py-4">
                      <button
                        onClick={() => setSelectedPromptLog(log)}
                        className="line-clamp-3 text-left font-semibold leading-6 text-slate-700 underline decoration-indigo-200 underline-offset-4 transition hover:text-indigo-700 hover:decoration-indigo-500"
                      >
                        {log.prompt}
                      </button>
                    </td>
                    <td className="max-w-[240px] px-4 py-4">
                      <p className="line-clamp-3 font-mono text-xs leading-5 text-slate-500">
                        {log.generatedCode || "未提取到 HTML 代码"}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 font-black text-white transition hover:bg-indigo-700"
                        >
                          <Eye size={16} />
                          查看作品
                        </button>
                        <button
                          onClick={() => deleteOneLog(log)}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 font-black text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center gap-2 p-8 text-sm font-black text-indigo-600">
              <Loader2 size={18} className="animate-spin" />
              正在读取课堂记录...
            </div>
          )}

          {!isLoading && logs.length === 0 && (
            <div className="p-8 text-center text-sm font-semibold text-slate-500">
              还没有匹配的作品记录。
            </div>
          )}
        </div>
      </section>

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-black">
                  {selectedLog.studentName} 的 {selectedLog.workTitle}
                </h3>
                <p className="text-xs font-semibold text-slate-500">
                  {selectedLog.studentClass}班 ·{" "}
                  {new Date(selectedLog.createdAt).toLocaleString("zh-CN")} ·{" "}
                  {selectedLog.likes} 赞 ·{" "}
                  {selectedLog.averageScore
                    ? `${selectedLog.averageScore} 分`
                    : "待评价"}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>
            <iframe
              title="学生作品预览"
              srcDoc={
                selectedLog.generatedCode ||
                "<html><body><h1>未提取到 HTML 代码</h1></body></html>"
              }
              sandbox="allow-scripts allow-forms allow-modals"
              className="min-h-0 flex-1 border-0 bg-white"
            />
          </div>
        </div>
      )}

      {selectedPromptLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-black">完整输入提示词</h3>
                <p className="text-xs font-semibold text-slate-500">
                  {selectedPromptLog.studentClass}班 ·{" "}
                  {selectedPromptLog.studentName} ·{" "}
                  {selectedPromptLog.workTitle}
                </p>
              </div>
              <button
                onClick={() => setSelectedPromptLog(null)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>
            <div className="magic-scrollbar max-h-[70vh] overflow-y-auto p-5">
              <p className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-7 text-slate-800">
                {selectedPromptLog.prompt}
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
