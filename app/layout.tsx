import type { Metadata } from "next";
import { Toaster } from "sonner";

import "./globals.css";

export const metadata: Metadata = {
  title: "面试间 · AI 模拟面试官",
  description:
    "AI 驱动的模拟面试：选择岗位，AI 逐题提问与即时点评，结束后生成结构化复盘报告。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="antialiased pattern">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
