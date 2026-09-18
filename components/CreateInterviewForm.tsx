"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INTERVIEW_TYPES, LEVELS, interviewRoles } from "@/constants";
import { listDocs } from "@/lib/knowledge";
import { retrieveContext } from "@/lib/rag";
import { createInterview } from "@/lib/storage";
import { cn } from "@/lib/utils";

const AMOUNTS = [3, 5, 8];

const chipClass = (active: boolean) =>
  cn(
    "rounded-full border px-4 py-2 text-sm font-medium transition cursor-pointer",
    active
      ? "border-primary-200 bg-primary-200 text-dark-100"
      : "border-white/10 bg-white/5 text-light-100/80 hover:bg-white/10"
  );

const CreateInterviewForm = () => {
  const router = useRouter();

  const [roleId, setRoleId] = useState("frontend");
  const [customRole, setCustomRole] = useState("");
  const [customTech, setCustomTech] = useState("");
  const [jd, setJd] = useState("");
  const [level, setLevel] = useState<string>("校招");
  const [type, setType] = useState<InterviewType>("mixed");
  const [amount, setAmount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [kbDocs, setKbDocs] = useState<KnowledgeDoc[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

  useEffect(() => {
    setKbDocs(listDocs());
  }, []);

  const preset = interviewRoles.find((role) => role.id === roleId)!;
  const isCustom = roleId === "custom";

  const handleSubmit = async () => {
    if (isCustom && !customRole.trim()) {
      toast.error("请先填写岗位名称");
      return;
    }

    setLoading(true);
    try {
      const techstack = isCustom
        ? customTech
            .split(/[,，、\s]+/)
            .map((item) => item.trim())
            .filter(Boolean)
        : preset.techstack;
      const role = isCustom ? customRole.trim() : preset.name;

      const selectedDocs = kbDocs.filter((doc) =>
        selectedDocIds.includes(doc.id)
      );
      const queryText = [role, techstack.join(" "), jd, level]
        .filter(Boolean)
        .join(" ");
      const context = retrieveContext(selectedDocs, queryText, 4);

      if (selectedDocs.length && !context.hitCount) {
        toast.message("知识库里没检索到相关片段，本次按普通出题");
      }

      const response = await fetch("/api/interview/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId,
          role,
          level,
          type,
          techstack,
          amount,
          jd: jd.trim() || undefined,
          context: context.text || undefined,
          contextSources: context.sources,
        }),
      });

      const data = await response.json();
      if (!data?.questions?.length) throw new Error("出题失败");

      const record = createInterview({
        roleId,
        role,
        level,
        type,
        techstack,
        questions: data.questions,
      });

      if (data.source === "fallback") {
        toast.message(data.message ?? "已使用内置题库出题");
      } else if (context.hitCount) {
        toast.success(`已引用 ${context.hitCount} 个知识片段出题`);
      }

      router.push(`/interview/${record.id}`);
    } catch (error) {
      console.error(error);
      toast.error("创建面试失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <Label className="text-base">目标岗位</Label>
        <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
          {interviewRoles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => setRoleId(role.id)}
              className={cn(
                "card-border text-left",
                roleId === role.id && "ring-2 ring-primary-200/60"
              )}
            >
              <div className="dark-gradient flex h-full items-start gap-4 rounded-2xl p-5">
                <span className="text-3xl">{role.emoji}</span>
                <span className="flex flex-col gap-1">
                  <span className="font-semibold text-primary-100">
                    {role.name}
                  </span>
                  <span className="text-sm text-light-100/60">
                    {role.description}
                  </span>
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {isCustom && (
        <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="customRole">岗位名称</Label>
            <Input
              id="customRole"
              value={customRole}
              onChange={(event) => setCustomRole(event.target.value)}
              placeholder="例如：嵌入式软件工程师"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="customTech">技术栈 / 关键词（用逗号分隔）</Label>
            <Input
              id="customTech"
              value={customTech}
              onChange={(event) => setCustomTech(event.target.value)}
              placeholder="例如：C 语言, STM32, FreeRTOS"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="jd">岗位描述 JD（选填，粘贴后出题更准）</Label>
            <textarea
              id="jd"
              value={jd}
              onChange={(event) => setJd(event.target.value)}
              rows={4}
              placeholder="把招聘网站上的 JD 粘到这里…"
              className="w-full resize-y rounded-2xl border border-white/10 bg-dark-200 px-4 py-3 text-sm text-light-100 outline-none placeholder:text-light-100/40 focus:border-primary-200/60"
            />
          </div>
        </section>
      )}

      {kbDocs.length > 0 && (
        <section className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label className="text-base">关联知识库（选填）</Label>
            <Link
              href="/knowledge"
              className="text-xs text-primary-200/80 transition hover:text-primary-100"
            >
              管理知识库 →
            </Link>
          </div>

          <p className="text-sm text-light-100/55">
            选中后会用 BM25 检索出最相关的片段喂给 AI，让题目贴着你的真实经历走。
          </p>

          <div className="flex flex-wrap gap-2">
            {kbDocs.map((doc) => {
              const active = selectedDocIds.includes(doc.id);
              return (
                <button
                  key={doc.id}
                  type="button"
                  className={chipClass(active)}
                  onClick={() =>
                    setSelectedDocIds((prev) =>
                      active
                        ? prev.filter((id) => id !== doc.id)
                        : [...prev, doc.id]
                    )
                  }
                >
                  {doc.title}
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="flex flex-wrap gap-8">
        <div className="flex flex-col gap-3">
          <Label className="text-base">经验档位</Label>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((item) => (
              <button
                key={item}
                type="button"
                className={chipClass(level === item)}
                onClick={() => setLevel(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Label className="text-base">面试类型</Label>
          <div className="flex flex-wrap gap-2">
            {INTERVIEW_TYPES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={chipClass(type === item.id)}
                onClick={() => setType(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Label className="text-base">题目数量</Label>
          <div className="flex flex-wrap gap-2">
            {AMOUNTS.map((item) => (
              <button
                key={item}
                type="button"
                className={chipClass(amount === item)}
                onClick={() => setAmount(item)}
              >
                {item} 题
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="flex items-center gap-4">
        <Button
          className="btn-primary min-w-40"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "AI 正在出题…" : "生成面试并开始"}
        </Button>
        <span className="text-sm text-light-100/50">
          出题约需 5-15 秒，取决于模型速度
        </span>
      </div>
    </div>
  );
};

export default CreateInterviewForm;
