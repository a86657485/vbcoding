import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vibe Coding 魔法工作台",
  description: "面向小学四五年级的本地局域网氛围编程教学平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
