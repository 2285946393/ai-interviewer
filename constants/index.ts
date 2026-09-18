import { z } from "zod";

export const LEVELS = ["实习", "校招", "社招初级"] as const;

export const INTERVIEW_TYPES = [
  { id: "technical", label: "技术面" },
  { id: "behavioral", label: "行为面" },
  { id: "mixed", label: "综合面" },
] as const;

export const interviewRoles: RolePreset[] = [
  {
    id: "frontend",
    name: "前端开发",
    emoji: "🖥️",
    description: "HTML / CSS / JavaScript / React / 工程化与性能",
    techstack: ["JavaScript", "TypeScript", "React", "CSS", "Next.js"],
    fallbackQuestions: [
      "介绍一下你做过的印象最深的项目，你负责了哪一部分？",
      "讲讲浏览器从输入 URL 到页面渲染完成发生了什么。",
      "React 的 useState 和 useRef 有什么区别？各自适合什么场景？",
      "你如何定位并优化一个首屏加载很慢的页面？",
      "谈谈你对闭包的理解，以及它可能带来的内存问题。",
      "如果让你设计一个可复用的组件库，你会怎么规划目录和 API？",
    ],
  },
  {
    id: "aigc",
    name: "AIGC 内容运营",
    emoji: "🎨",
    description: "AI 绘图 / 提示词工程 / 内容策划与数据复盘",
    techstack: ["Prompt Engineering", "Midjourney", "LoRA", "内容策划"],
    fallbackQuestions: [
      "你是如何保证 AI 绘图作品的角色一致性的？",
      "给你一个从 0 起号的账号，你会怎么规划前两周的内容？",
      "聊聊你做过的一次内容数据复盘，你从数据里发现了什么？",
      "一个热点出现后，你会用什么流程判断它值不值得跟进？",
      "你如何向不懂技术的同事解释什么是 LoRA 微调？",
      "如果 AI 生成的内容出现事实错误，你的处理流程是什么？",
    ],
  },
  {
    id: "ee",
    name: "电子信息工程",
    emoji: "📡",
    description: "信号与系统 / 通信原理 / 单片机与嵌入式",
    techstack: ["信号处理", "通信原理", "C 语言", "单片机"],
    fallbackQuestions: [
      "解释一下奈奎斯特采样定理，如果不满足会发生什么？",
      "AM 和 FM 调制在抗噪声性能上有什么区别？",
      "你如何用单片机采集一个模拟信号并做数字滤波？",
      "讲讲你对傅里叶变换的直观理解。",
      "设计一个电源电路时你会考虑哪些指标？",
      "串口通信中波特率和比特率是什么关系？",
    ],
  },
  {
    id: "custom",
    name: "自定义岗位",
    emoji: "✨",
    description: "自己填写岗位名称与技术栈，AI 按你的描述出题",
    techstack: [],
    fallbackQuestions: [
      "请先做一个简短的自我介绍。",
      "你为什么想应聘这个岗位？",
      "讲一个你遇到过的最大挑战，以及你是怎么解决的。",
      "你认为自己最大的优势和短板分别是什么？",
      "你未来三年的职业规划是怎样的？",
    ],
  },
];

export const feedbackSchema = z.object({
  totalScore: z.number(),
  categoryScores: z.array(
    z.object({
      name: z.string(),
      score: z.number(),
      comment: z.string(),
    })
  ),
  strengths: z.array(z.string()),
  areasForImprovement: z.array(z.string()),
  finalAssessment: z.string(),
});

export const FEEDBACK_CATEGORIES = [
  "专业能力",
  "表达与沟通",
  "逻辑与结构",
  "岗位匹配度",
  "自信与应变",
];

export const ROLE_MAP = Object.fromEntries(
  interviewRoles.map((r) => [r.id, r])
) as Record<string, RolePreset>;
