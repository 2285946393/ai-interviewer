import Link from "next/link";
import { ReactNode } from "react";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="root-layout">
      <nav className="flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="text-3xl">🎙️</span>
          <span className="flex flex-col leading-tight">
            <span className="text-xl font-bold text-primary-100">面试间</span>
            <span className="text-xs text-light-100/60">
              AI Mock Interviewer
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/knowledge"
            className="rounded-full px-4 py-2 text-sm text-light-100/70 transition hover:bg-white/5 hover:text-light-100"
          >
            知识库
          </Link>

          <Link
            href="/interview"
            className="rounded-full bg-primary-200/10 px-4 py-2 text-sm font-semibold text-primary-200 transition hover:bg-primary-200/20"
          >
            + 新面试
          </Link>
        </div>
      </nav>

      {children}
    </div>
  );
};

export default Layout;
