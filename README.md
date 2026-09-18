# 面试间 · AI 模拟面试官

> 选岗位 → AI 逐题提问 → 针对你的回答即时点评并追问 → 结束后生成结构化复盘报告

一个真正能跑起来的 AI 面试练习工具。内置前端开发 / AIGC 内容运营 / 电子信息工程三套题库，也可以粘贴 JD 自定义岗位。

## 功能

- **AI 现场出题**：按岗位、经验档位、面试类型（技术 / 行为 / 综合）和题量生成题目，支持粘贴 JD 定向出题
- **流式对话**：面试官逐题提问，针对你的回答给出一句具体肯定 + 一个追问，文字流式输出
- **语音朗读**：Web Speech API 朗读题目与点评，可一键开关（Chrome / Edge 支持良好）
- **结构化复盘**：结束后生成总分 + 5 个能力维度评分 + 亮点 + 可执行改进建议 + 逐题回顾
- **知识库 + RAG 检索**：把自己的 JD / 简历 / 面经 / 笔记存进知识库，出题前用 BM25 检索出最相关片段喂给模型，让题目贴着你的真实经历走（内置检索测试面板，可直接看到命中的片段）
- **本地存档**：所有记录与知识库都存在浏览器 localStorage，无需注册登录，不上传任何数据
- **优雅降级**：未配置 API Key 或模型调用失败时，自动回退到内置题库与本地估算，界面不白屏

## 技术栈

| 层 | 选型 |
| --- | --- |
| 框架 | Next.js 15（App Router）+ React 19 |
| 语言 | TypeScript（`tsc --noEmit` 零错误） |
| 样式 | Tailwind CSS 4 + shadcn/ui（Radix）+ CVA |
| AI | Vercel AI SDK 4 + OpenAI 兼容 Provider（默认 DeepSeek） |
| 检索 | 自研 BM25 稀疏检索（中文 bigram 分词，零依赖） |
| 状态 | React Hooks + localStorage 持久化 |
| 语音 | 浏览器原生 Web Speech API |
| 校验 | Zod（结构化输出 schema） |

## 架构

```
app/
├─ (root)/
│  ├─ page.tsx                      首页：数据统计 + 面试列表
│  ├─ interview/page.tsx            新建面试（岗位 / 档位 / 类型 / 题量 / 关联知识库）
│  ├─ knowledge/page.tsx            知识库管理 + 检索测试
│  └─ interview/[id]/
│     ├─ page.tsx                   面试间
│     └─ feedback/page.tsx          复盘报告
└─ api/interview/
   ├─ generate/route.ts             出题（JSON，失败回退内置题库）
   ├─ chat/route.ts                 面试官点评（流式文本）
   └─ feedback/route.ts             结构化评分（Zod schema，失败回退本地估算）

lib/
├─ ai.ts          Provider 抽象：改 3 个环境变量即可换模型 / 换服务商
├─ rag.ts         BM25 稀疏检索：中文 bigram 分词 + 文档切分 + 上下文组装
├─ knowledge.ts   知识库 localStorage 数据层
├─ storage.ts     localStorage 数据层（增删改查）
├─ speech.ts      Web Speech API 封装（中文音色优选 + 打断控制）
└─ utils.ts       样式与评分色阶工具
```

### 几个设计取舍

- **数据放浏览器而不是数据库**：这是求职练习工具，用户不该为了练一次面试去注册账号。localStorage 把首次可用时间压到 0 秒，也天然没有隐私顾虑。
- **Provider 抽象而不是硬编码**：`lib/ai.ts` 只依赖 OpenAI 兼容协议，换 DeepSeek / 硅基流动 / 智谱 / OpenAI 只改环境变量，不动业务代码。
- **三级降级**：AI 出题失败 → 内置题库；AI 点评失败 → 本地模拟文案；AI 评分失败 → 本地估算。任何一环挂掉，用户都能走完整流程。
- **AI 回复不做 markdown 渲染**：点评会被语音朗读，所以提示词里明确要求模型不输出任何格式符号。
- **检索用 BM25 而不是向量库**：中文短文档场景下 BM25 命中率已经够用，而且纯浏览器端运行、零额外 API 成本、结果可解释（能直接看到命中了哪一段）。检索在浏览器完成，只把拼好的上下文发给服务端，知识库原文不需要上传到任何服务器。

## 本地运行

```bash
npm install
cp .env.example .env.local   # 填入你的 API Key
npm run dev
```

打开 http://localhost:3000

> 不配 Key 也能跑：题目走内置题库，点评走本地模拟文案。

## 环境变量

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `AI_API_KEY` | 否 | OpenAI 兼容接口的 Key。不填则全程降级运行 |
| `AI_BASE_URL` | 否 | 默认 `https://api.deepseek.com/v1` |
| `AI_MODEL` | 否 | 默认 `deepseek-chat` |
| `AI_PROVIDER_NAME` | 否 | 默认 `deepseek` |

## 部署

Vercel 一键部署。在 Project Settings → Environment Variables 里配置 `AI_API_KEY` 即可。

## 说明

UI 骨架与视觉风格参考了 JSM 的 PrepWise 教程项目（Next.js + Firebase + Vapi），
但**数据层、AI 调用层、面试交互层全部重写**：拆掉了 Firebase 认证 / 数据库与付费的 Vapi 语音服务，
改为 localStorage + Vercel AI SDK + 浏览器原生语音，并加入中文题库与三级降级策略。
