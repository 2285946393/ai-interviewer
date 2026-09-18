import { generateObject } from "ai";

import { chatModel, hasApiKey } from "@/lib/ai";
import { FEEDBACK_CATEGORIES, feedbackSchema } from "@/constants";

export const runtime = "nodejs";

function localFallback(turns: InterviewTurn[]): Feedback {
  const answered = turns.filter((t) => t.answer?.trim()).length;
  const total = turns.length || 1;
  const completion = Math.round((answered / total) * 100);
  const avgLength =
    turns.reduce((sum, t) => sum + (t.answer?.length ?? 0), 0) / (answered || 1);

  const depthScore = Math.min(95, Math.round(avgLength / 3) + 40);
  const totalScore = Math.round((completion + depthScore) / 2);

  return {
    totalScore,
    categoryScores: FEEDBACK_CATEGORIES.map((name) => ({
      name,
      score: totalScore,
      comment: "本地估算（未配置 AI_API_KEY，无法生成详细点评）。",
    })),
    strengths: ["完成了整场模拟面试，作答覆盖率 " + completion + "%"],
    areasForImprovement: [
      "配置 AI_API_KEY 后可以获得针对每道回答的详细诊断",
      avgLength < 80 ? "回答整体偏短，建议补充具体的项目细节与数据" : "继续保持，注意结论先行",
    ],
    finalAssessment: `本次共 ${total} 道题，有效作答 ${answered} 道。这是一份本地估算报告。`,
    createdAt: new Date().toISOString(),
  };
}

export async function POST(request: Request) {
  const body = await request.json();
  const { role, level, type, turns = [] } = body as {
    role: string;
    level: string;
    type: string;
    turns: InterviewTurn[];
  };

  if (!hasApiKey) {
    return Response.json({ success: true, feedback: localFallback(turns) });
  }

  const transcript = turns
    .map((turn, index) => {
      const parts = [`第 ${index + 1} 题：${turn.question}`, `候选人回答：${turn.answer || "（未作答）"}`];
      if (turn.followUp) parts.push(`追问：${turn.followUp}`);
      if (turn.followUpAnswer) parts.push(`候选人补充：${turn.followUpAnswer}`);
      return parts.join("\n");
    })
    .join("\n\n");

  const typeLabel =
    type === "technical" ? "技术面" : type === "behavioral" ? "行为面" : "综合面";

  try {
    const { object } = await generateObject({
      model: chatModel,
      schema: feedbackSchema,
      mode: "json",
      system:
        "你是一位严格但公正的面试官，正在复盘一场模拟面试。你的评价必须基于候选人真实说过的内容，不要编造，也不要一味鼓励。",
      prompt: `岗位：${role}
候选人背景：${level}
面试类型：${typeLabel}

以下是完整的面试记录：

${transcript}

请给出结构化复盘，要求：
1. totalScore 为 0-100 的整数，反映整体竞争力（严格一点，60 分代表"能达到面试及格线"）
2. categoryScores 必须恰好包含这 5 个维度，名称必须完全一致：${FEEDBACK_CATEGORIES.join("、")}
   每个维度给出 0-100 的分数和一句具体的中文点评（指出具体是哪一句话/哪个行为导致的）
3. strengths 给 3 条，必须引用候选人回答里的具体内容
4. areasForImprovement 给 3 条，要可执行（告诉候选人下次具体怎么做）
5. finalAssessment 用 2-3 句话总结，说明这场面试最关键的短板在哪里

全部使用中文。`,
    });

    return Response.json({
      success: true,
      feedback: { ...object, createdAt: new Date().toISOString() },
    });
  } catch (error) {
    console.error("生成反馈失败:", error);
    return Response.json({
      success: true,
      feedback: localFallback(turns),
      message: "AI 评分失败，已回退到本地估算",
    });
  }
}
