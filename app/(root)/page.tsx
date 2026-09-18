"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import InterviewCard from "@/components/InterviewCard";
import { Button } from "@/components/ui/button";
import { listInterviews } from "@/lib/storage";

const StatCard = ({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number | string;
  suffix?: string;
}) => (
  <div className="card-border flex-1 min-w-[150px]">
    <div className="dark-gradient rounded-2xl px-6 py-5">
      <p className="text-sm text-light-100/60">{label}</p>
      <p className="mt-2 text-3xl font-bold text-primary-100">
        {value}
        {suffix && (
          <span className="ml-1 text-base font-normal text-light-100/60">
            {suffix}
          </span>
        )}
      </p>
    </div>
  </div>
);

const Home = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setInterviews(listInterviews());
    setLoaded(true);
  }, []);

  const completed = interviews.filter((item) => item.feedback);
  const averageScore = completed.length
    ? Math.round(
        completed.reduce(
          (sum, item) => sum + (item.feedback?.totalScore ?? 0),
          0
        ) / completed.length
      )
    : 0;
  const totalAnswers = interviews.reduce(
    (sum, item) => sum + item.turns.filter((t) => t.answer?.trim()).length,
    0
  );

  return (
    <>
      <section className="card-cta">
        <div className="flex max-w-lg flex-col gap-6">
          <h2>把面试练到不慌，再走进真正的面试间</h2>
          <p className="text-lg text-light-100/80">
            选择目标岗位，AI 面试官会逐题提问、针对你的回答即时点评并追问，
            结束后给你一份结构化的复盘报告。
          </p>

          <Button asChild className="btn-primary max-sm:w-full">
            <Link href="/interview">开始一场模拟面试</Link>
          </Button>
        </div>

        <Image
          src="/robot.png"
          alt="AI 面试官"
          width={360}
          height={360}
          className="max-sm:hidden"
          priority
        />
      </section>

      {loaded && interviews.length > 0 && (
        <section className="flex flex-wrap gap-4">
          <StatCard label="已完成面试" value={completed.length} suffix="场" />
          <StatCard label="平均得分" value={averageScore || "--"} suffix="/100" />
          <StatCard label="累计作答" value={totalAnswers} suffix="题" />
        </section>
      )}

      <section className="mt-4 flex flex-col gap-6">
        <div className="flex items-baseline justify-between">
          <h2>我的面试</h2>
          {interviews.length > 0 && (
            <span className="text-sm text-light-100/50">
              共 {interviews.length} 场 · 数据仅保存在本机浏览器
            </span>
          )}
        </div>

        <div className="interviews-section">
          {!loaded ? (
            <p className="text-light-100/60">加载中…</p>
          ) : interviews.length > 0 ? (
            interviews.map((interview) => (
              <InterviewCard key={interview.id} interview={interview} />
            ))
          ) : (
            <div className="card-border w-full">
              <div className="dark-gradient flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl px-6 py-10 text-center">
                <span className="text-4xl">🗂️</span>
                <p className="text-light-100/70">
                  还没有面试记录。点上面的按钮，开始第一场模拟面试吧。
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default Home;
