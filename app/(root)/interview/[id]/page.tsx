"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import InterviewRoom from "@/components/InterviewRoom";
import { Button } from "@/components/ui/button";
import { getInterview } from "@/lib/storage";

const InterviewDetailPage = () => {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [interview, setInterview] = useState<Interview | null | undefined>(
    undefined
  );

  useEffect(() => {
    if (!id) return;
    setInterview(getInterview(id));
  }, [id]);

  if (interview === undefined) {
    return <p className="text-light-100/60">加载中…</p>;
  }

  if (interview === null) {
    return (
      <div className="card-border w-full">
        <div className="dark-gradient flex min-h-48 flex-col items-center justify-center gap-4 rounded-2xl p-10 text-center">
          <span className="text-4xl">🕳️</span>
          <p className="text-light-100/70">
            找不到这场面试，可能是浏览器缓存被清理了。
          </p>
          <Button className="btn-primary">
            <Link href="/interview">重新创建一场</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <InterviewRoom interview={interview} />;
};

export default InterviewDetailPage;
