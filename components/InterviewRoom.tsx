"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ROLE_MAP } from "@/constants";
import { isSpeechSupported, speak, stopSpeaking } from "@/lib/speech";
import { updateInterview } from "@/lib/storage";
import { cn } from "@/lib/utils";

type Phase = "answering" | "reviewing" | "reviewed" | "finishing";

const TYPE_LABEL: Record<string, string> = {
  technical: "技术面",
  behavioral: "行为面",
  mixed: "综合面",
};

const Bubble = ({
  side,
  avatar,
  children,
  speaking,
}: {
  side: "interviewer" | "user";
  avatar: string;
  children: React.ReactNode;
  speaking?: boolean;
}) => (
  <div
    className={cn(
      "flex gap-3",
      side === "user" ? "flex-row-reverse" : "flex-row"
    )}
  >
    <div
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full text-xl",
        side === "interviewer" ? "bg-primary-200/15" : "bg-white/10",
        speaking && "animate-pulse ring-2 ring-primary-200/50"
      )}
    >
      {avatar}
    </div>

    <div
      className={cn(
        "max-w-[min(720px,85%)] px-5 py-4 text-[15px] leading-7",
        side === "interviewer"
          ? "rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.04] text-light-100"
          : "rounded-2xl rounded-tr-sm border border-primary-200/25 bg-primary-200/10 text-light-100"
      )}
    >
      {children}
    </div>
  </div>
);

const InterviewRoom = ({ interview }: { interview: Interview }) => {
  const router = useRouter();
  const questions = interview.questions;
  const preset = ROLE_MAP[interview.roleId];

  const [turns, setTurns] = useState<InterviewTurn[]>(interview.turns ?? []);
  const [pending, setPending] = useState<InterviewTurn | null>(null);
  const [answer, setAnswer] = useState("");
  const [comment, setComment] = useState("");
  const [phase, setPhase] = useState<Phase>("answering");
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  const index = turns.length;
  const allDone = index >= questions.length;
  const activeQuestion = pending?.question ?? questions[index] ?? "";

  useEffect(() => {
    if (!autoSpeak || allDone || phase !== "answering") return;
    const question = questions[index];
    if (!question) return;

    setSpeaking(true);
    speak(question);
    const timer = window.setTimeout(
      () => setSpeaking(false),
      Math.min(question.length * 180, 12000)
    );

    return () => {
      window.clearTimeout(timer);
      stopSpeaking();
      setSpeaking(false);
    };
  }, [index, autoSpeak, allDone, phase, questions]);

  const handleSubmit = async () => {
    if (!answer.trim()) {
      toast.error("先写点内容再提交吧");
      return;
    }

    const question = questions[index];
    const userAnswer = answer.trim();

    setPending({ question, answer: userAnswer, comment: "" });
    setComment("");
    setPhase("reviewing");
    stopSpeaking();

    try {
      const response = await fetch("/api/interview/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: interview.role,
          level: interview.level,
          type: interview.type,
          question,
          answer: userAnswer,
          history: turns.map((turn) => ({
            question: turn.question,
            answer: turn.answer,
          })),
        }),
      });

      if (!response.body) throw new Error("面试官没有返回内容");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setComment(acc);
      }

      const finalComment = acc.trim() || "（面试官沉默了一会儿）";
      setPending({ question, answer: userAnswer, comment: finalComment });
      setPhase("reviewed");

      if (autoSpeak) {
        setSpeaking(true);
        speak(finalComment);
        window.setTimeout(
          () => setSpeaking(false),
          Math.min(finalComment.length * 200, 15000)
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("面试官走神了，请重试");
      setPending(null);
      setPhase("answering");
    }
  };

  const handleFinish = async (finalTurns?: InterviewTurn[]) => {
    const list = finalTurns ?? (pending ? [...turns, pending] : turns);

    if (list.length === 0) {
      toast.error("至少回答一道题才能生成报告");
      return;
    }

    setPhase("finishing");
    stopSpeaking();

    try {
      const response = await fetch("/api/interview/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: interview.role,
          level: interview.level,
          type: interview.type,
          turns: list,
        }),
      });

      const data = await response.json();
      if (!data?.feedback) throw new Error("评分失败");

      updateInterview(interview.id, {
        turns: list,
        feedback: data.feedback,
        status: "completed",
      });

      toast.success("复盘报告已生成");
      router.push(`/interview/${interview.id}/feedback`);
    } catch (error) {
      console.error(error);
      toast.error("生成报告失败，请重试");
      setPhase("reviewed");
    }
  };

  const handleNext = () => {
    if (!pending) return;

    const nextTurns = [...turns, pending];
    updateInterview(interview.id, { turns: nextTurns, status: "in-progress" });

    if (nextTurns.length >= questions.length) {
      handleFinish(nextTurns);
      return;
    }

    setTurns(nextTurns);
    setPending(null);
    setComment("");
    setAnswer("");
    setPhase("answering");
  };

  const progress = Math.round(
    ((turns.length + (pending ? 1 : 0)) / questions.length) * 100
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{preset?.emoji ?? "💼"}</span>
          <div>
            <h3>{interview.role}</h3>
            <p className="text-sm text-light-100/60">
              {interview.level} · {TYPE_LABEL[interview.type]} ·{" "}
              {questions.length} 题
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (autoSpeak) stopSpeaking();
              setAutoSpeak((value) => !value);
            }}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-light-100/80 transition hover:bg-white/10"
          >
            {autoSpeak ? "🔊 语音已开" : "🔇 语音已关"}
          </button>

          {!isSpeechSupported() && (
            <span className="text-xs text-light-100/40">
              当前浏览器不支持语音朗读
            </span>
          )}

          <Button
            variant="outline"
            onClick={() => handleFinish()}
            disabled={phase === "finishing"}
          >
            {phase === "finishing" ? "正在生成报告…" : "结束并生成报告"}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary-200 to-primary-100 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="w-16 text-right text-sm text-light-100/60">
          {Math.min(turns.length + (pending ? 1 : 0), questions.length)} /{" "}
          {questions.length}
        </span>
      </div>

      {allDone && phase === "answering" ? (
        <div className="card-border w-full">
          <div className="dark-gradient flex flex-col items-center gap-4 rounded-2xl p-10 text-center">
            <span className="text-4xl">🎉</span>
            <p className="text-light-100/80">
              你已经答完全部 {questions.length} 道题，让 AI 面试官给你一份复盘吧。
            </p>
            <Button className="btn-primary" onClick={() => handleFinish()}>
              生成复盘报告
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-5">
            <Bubble side="interviewer" avatar="🤖" speaking={speaking}>
              <p className="whitespace-pre-wrap">{activeQuestion}</p>
              <button
                type="button"
                onClick={() => speak(activeQuestion)}
                className="mt-3 text-xs text-primary-200/80 transition hover:text-primary-100"
              >
                🔊 重听这一题
              </button>
            </Bubble>

            {(pending || phase === "reviewing") && (
              <Bubble side="user" avatar="🙋">
                <p className="whitespace-pre-wrap">{pending?.answer}</p>
              </Bubble>
            )}

            {(phase === "reviewing" || phase === "reviewed") && (
              <Bubble side="interviewer" avatar="🤖" speaking={speaking}>
                <p className="whitespace-pre-wrap">
                  {comment || "面试官正在思考…"}
                  {phase === "reviewing" && (
                    <span className="ml-0.5 animate-pulse text-primary-200">
                      ▍
                    </span>
                  )}
                </p>
              </Bubble>
            )}
          </div>

          {phase === "answering" && (
            <div className="flex flex-col gap-3">
              <textarea
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                onKeyDown={(event) => {
                  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                    event.preventDefault();
                    handleSubmit();
                  }
                }}
                rows={5}
                placeholder="在这里写下你的回答。尽量说具体：项目背景、你做了什么、结果如何。"
                className="w-full resize-y rounded-2xl border border-white/10 bg-dark-200 px-5 py-4 text-[15px] leading-7 text-light-100 outline-none placeholder:text-light-100/35 focus:border-primary-200/60"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-light-100/40">
                  {answer.length} 字 · Ctrl + Enter 快速提交
                </span>
                <Button className="btn-primary" onClick={handleSubmit}>
                  提交回答
                </Button>
              </div>
            </div>
          )}

          {phase === "reviewed" && (
            <div className="flex flex-wrap items-center gap-3">
              <Button className="btn-primary" onClick={handleNext}>
                {index + 1 >= questions.length ? "生成复盘报告" : "下一题 →"}
              </Button>
              <Button variant="outline" onClick={() => handleFinish()}>
                结束并生成报告
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InterviewRoom;
