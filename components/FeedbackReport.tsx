"use client";

import dayjs from "dayjs";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ROLE_MAP } from "@/constants";
import { cn, scoreBar, scoreTone } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  technical: "技术面",
  behavioral: "行为面",
  mixed: "综合面",
};

const ScoreRing = ({ score }: { score: number }) => {
  const clamped = Math.max(0, Math.min(100, score));

  return (
    <div
      className="relative flex size-40 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(#cac5fe ${clamped * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
      }}
    >
      <div className="flex size-32 flex-col items-center justify-center rounded-full bg-dark-100">
        <span className="text-4xl font-bold text-primary-100">{clamped}</span>
        <span className="text-xs text-light-100/50">/ 100</span>
      </div>
    </div>
  );
};

const FeedbackReport = ({ interview }: { interview: Interview }) => {
  const feedback = interview.feedback!;
  const preset = ROLE_MAP[interview.roleId];

  return (
    <section className="section-feedback">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-sm text-light-100/50">面试复盘报告</span>
          <h2 className="flex items-center gap-3">
            <span>{preset?.emoji ?? "💼"}</span>
            {interview.role}
          </h2>
          <p className="text-sm text-light-100/60">
            {interview.level} · {TYPE_LABEL[interview.type]} ·{" "}
            {dayjs(feedback.createdAt).format("YYYY-MM-DD HH:mm")}
          </p>
        </div>

        <ScoreRing score={feedback.totalScore} />
      </div>

      <div className="rounded-2xl border border-primary-200/20 bg-primary-200/[0.06] p-6 text-[15px] leading-8 text-light-100/90">
        {feedback.finalAssessment}
      </div>

      <div className="flex flex-col gap-5">
        <h3>能力维度</h3>
        {feedback.categoryScores.map((category) => (
          <div key={category.name} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-light-100">
                {category.name}
              </span>
              <span className={cn("font-bold", scoreTone(category.score))}>
                {category.score}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className={cn(
                  "h-full rounded-full bg-gradient-to-r transition-all duration-700",
                  scoreBar(category.score)
                )}
                style={{ width: `${category.score}%` }}
              />
            </div>
            <p className="text-sm text-light-100/60">{category.comment}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] p-6">
          <h3 className="text-emerald-200">做得好的地方</h3>
          <ul className="flex flex-col gap-2">
            {feedback.strengths.map((item, index) => (
              <li key={index} className="text-[15px] leading-7 text-light-100/85">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-6">
          <h3 className="text-amber-200">下次可以这样改进</h3>
          <ul className="flex flex-col gap-2">
            {feedback.areasForImprovement.map((item, index) => (
              <li key={index} className="text-[15px] leading-7 text-light-100/85">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3>逐题回顾</h3>
        {interview.turns.map((turn, index) => (
          <details
            key={index}
            className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <summary className="cursor-pointer list-none text-[15px] font-semibold text-light-100">
              <span className="mr-2 text-primary-200">Q{index + 1}</span>
              {turn.question}
            </summary>

            <div className="mt-4 flex flex-col gap-3 text-sm leading-7">
              <div>
                <span className="text-light-100/50">你的回答：</span>
                <p className="mt-1 whitespace-pre-wrap text-light-100/85">
                  {turn.answer || "（未作答）"}
                </p>
              </div>
              <div>
                <span className="text-light-100/50">面试官点评：</span>
                <p className="mt-1 whitespace-pre-wrap text-light-100/85">
                  {turn.comment || "（无）"}
                </p>
              </div>
            </div>
          </details>
        ))}
      </div>

      <div className="buttons">
        <Button variant="outline" className="flex-1">
          <Link href="/" className="flex w-full justify-center">
            返回首页
          </Link>
        </Button>
        <Button className="btn-primary flex-1">
          <Link href="/interview" className="flex w-full justify-center">
            再面一场
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default FeedbackReport;
