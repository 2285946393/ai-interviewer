"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import FeedbackReport from "@/components/FeedbackReport";
import { Button } from "@/components/ui/button";
import { getInterview } from "@/lib/storage";

const FeedbackPage = () => {
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

  if (!interview?.feedback) {
    return (
      <div className="card-border w-full">
        <div className="dark-gradient flex min-h-48 flex-col items-center justify-center gap-4 rounded-2xl p-10 text-center">
          <span className="text-4xl">📄</span>
          <p className="text-light-100/70">
            这场面试还没有复盘报告，先去把它面完吧。
          </p>
          <Button className="btn-primary">
            <Link href={id ? `/interview/${id}` : "/interview"}>
              回到面试间
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return <FeedbackReport interview={interview} />;
};

export default FeedbackPage;
