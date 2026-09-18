import { streamText } from "ai";

import { chatModel, hasApiKey } from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json();
  const { role, level, type, question, answer, history = [] } = body as {
    role: string;
    level: string;
    type: string;
    question: string;
    answer: string;
    history: { question: string; answer: string }[];
  };

  if (!hasApiKey) {
    const text = [
      "谢谢你的回答。",
      "（提示：当前未配置 AI_API_KEY，这里是本地模拟的面试官回复。）",
      "如果这是真实面试，我会追问：你刚才提到的方案，有没有考虑过边界情况？",
    ].join("");
    return new Response(text, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const typeLabel =
    type === "technical" ? "技术面" : type === "behavioral" ? "行为面" : "综合面";

  const historyText = history
    .map(
      (item, index) =>
        `第 ${index + 1} 题：${item.question}\n候选人回答：${item.answer}`
    )
    .join("\n\n");

  const result = streamText({
    model: chatModel,
    system: `你是一位「${role}」岗位的资深面试官，正在面试一位${level}候选人（${typeLabel}）。

你的风格：专业、友善、敏锐。你在真实地听，而不是走流程。

硬性规则：
1. 每次回复不超过 130 个字
2. 先用一句话点出回答里真实存在的亮点（要具体，不要"很好很棒"这种空话）
3. 如果回答含糊、缺少细节或存在明显漏洞，追问一个具体问题
4. 你是面试官不是讲师，不要长篇讲解知识点
5. 纯口语中文，像真人说话
6. 绝对不要使用 markdown 符号、星号、井号、列表符号（这段文字会被语音朗读出来）`,
    prompt: `${historyText ? `此前的问答：\n${historyText}\n\n` : ""}当前问题：${question}

候选人的回答：${answer}

请给出你的即时反馈（可含一个追问）。`,
  });

  return result.toTextStreamResponse();
}
