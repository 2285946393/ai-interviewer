import { generateText } from "ai";

import { chatModel, hasApiKey } from "@/lib/ai";
import { ROLE_MAP } from "@/constants";

export const runtime = "nodejs";

function parseQuestions(text: string): string[] {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed.map((q) => String(q).trim()).filter(Boolean);
    }
  } catch {
    // fall through to regex parsing
  }

  const bracketMatch = cleaned.match(/\[[\s\S]*\]/);
  if (bracketMatch) {
    try {
      const parsed = JSON.parse(bracketMatch[0]);
      if (Array.isArray(parsed)) {
        return parsed.map((q) => String(q).trim()).filter(Boolean);
      }
    } catch {
      // fall through
    }
  }

  const quoted = [...cleaned.matchAll(/"([^"]{6,})"/g)].map((m) => m[1].trim());
  if (quoted.length >= 2) return quoted;

  return cleaned
    .split("\n")
    .map((line) => line.replace(/^[\s\-*\d.、）)]+/, "").trim())
    .filter((line) => line.length > 4);
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateInterviewPayload;
  const {
    roleId,
    role,
    level,
    type,
    techstack = [],
    amount = 5,
    jd,
    context,
  } = body;

  const preset = ROLE_MAP[roleId];
  const fallback = (preset?.fallbackQuestions ?? []).slice(0, amount);
  const roleName = role || preset?.name || "目标岗位";

  if (!hasApiKey) {
    return Response.json({
      success: true,
      source: "fallback",
      questions: fallback,
      message: "未配置 AI_API_KEY，已使用内置题库",
    });
  }

  const typeLabel =
    type === "technical" ? "技术面" : type === "behavioral" ? "行为面" : "综合面";

  try {
    const { text } = await generateText({
      model: chatModel,
      system:
        "你是一位资深的中文技术面试官，擅长设计有区分度的面试题。你只输出 JSON 数组，不输出任何多余解释。",
      prompt: `请为一场「${roleName}」岗位的模拟面试出题。

候选人背景：${level}
面试类型：${typeLabel}
岗位相关技术栈：${techstack.join("、") || "未指定"}
${jd ? `岗位描述（JD）：\n${jd}\n` : ""}${context ? `\n候选人的真实材料（由知识库检索得到，请优先围绕这些内容出题，让题目具体到他的经历与项目）：\n${context}\n` : ""}
出题要求：
1. 共 ${amount} 道题，由浅入深，覆盖不同能力维度
2. 至少 2 道题要引导候选人讲自己的真实项目经历与取舍
3. 避免空泛的「请介绍一下」，要具体、有画面感
4. 语言口语化，像真人面试官在聊天，而不是考试卷子
5. 不要出现 "slash" 或特殊符号${context ? "\n6. 材料里出现过的技术名词、项目名，可以自然地出现在题目里" : ""}

只输出 JSON 数组，例如：["第一题", "第二题"]`,
    });

    const questions = parseQuestions(text).slice(0, amount);

    if (questions.length === 0) {
      return Response.json({
        success: true,
        source: "fallback",
        questions: fallback,
      });
    }

    return Response.json({ success: true, source: "ai", questions });
  } catch (error) {
    console.error("生成面试题失败:", error);
    return Response.json({
      success: true,
      source: "fallback",
      questions: fallback,
      message: "AI 生成失败，已回退到内置题库",
    });
  }
}
