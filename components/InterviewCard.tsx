"use client";

import dayjs from "dayjs";
import Link from "next/link";

import TechStackTags from "./TechStackTags";
import { Button } from "@/components/ui/button";
import { ROLE_MAP } from "@/constants";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  technical: "技术面",
  behavioral: "行为面",
  mixed: "综合面",
};

const TYPE_COLOR: Record<string, string> = {
  technical: "bg-indigo-400/80",
  behavioral: "bg-emerald-400/80",
  mixed: "bg-fuchsia-400/80",
};

const InterviewCard = ({ interview }: InterviewCardProps) => {
  const preset = ROLE_MAP[interview.roleId];
  const score = interview.feedback?.totalScore;
  const hasFeedback = Boolean(interview.feedback);
  const answered = interview.turns.filter((t) => t.answer?.trim()).length;

  return (
    <div className="card-border w-[360px] max-sm:w-full">
      <div className="card-interview">
        <div>
          <div
            className={cn(
              "absolute right-0 top-0 w-fit rounded-bl-lg px-4 py-2",
              TYPE_COLOR[interview.type] ?? "bg-light-600"
            )}
          >
            <p className="badge-text text-dark-100">
              {TYPE_LABEL[interview.type] ?? interview.type}
            </p>
          </div>

          <div className="flex size-[90px] items-center justify-center rounded-full bg-gradient-to-br from-primary-200/30 to-primary-200/5 text-4xl">
            {preset?.emoji ?? "💼"}
          </div>

          <h3 className="mt-5">{interview.role}</h3>
          <p className="mt-1 text-sm text-light-100/60">
            {interview.level} · {interview.questions.length} 道题
          </p>

          <div className="mt-4 flex flex-row gap-5 text-sm text-light-100/70">
            <span>
              🗓 {dayjs(interview.createdAt).format("YYYY-MM-DD HH:mm")}
            </span>
            <span className="font-semibold">
              ⭐ {hasFeedback ? `${score}/100` : `已答 ${answered} 题`}
            </span>
          </div>

          <p className="mt-5 line-clamp-2 text-light-100/70">
            {interview.feedback?.finalAssessment ??
              "还没完成这场面试，进去练一练，AI 会给你逐题点评。"}
          </p>
        </div>

        <div className="flex flex-row items-end justify-between gap-3">
          <TechStackTags techStack={interview.techstack} />

          <Button className="btn-primary shrink-0">
            <Link
              href={
                hasFeedback
                  ? `/interview/${interview.id}/feedback`
                  : `/interview/${interview.id}`
              }
            >
              {hasFeedback ? "查看复盘" : "继续面试"}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterviewCard;
