import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const MODEL = process.env.AI_MODEL || "deepseek-chat";

export const provider = createOpenAICompatible({
  name: process.env.AI_PROVIDER_NAME || "deepseek",
  baseURL: process.env.AI_BASE_URL || "https://api.deepseek.com/v1",
  apiKey: process.env.AI_API_KEY || process.env.DEEPSEEK_API_KEY || "",
});

export const chatModel = provider.chatModel(MODEL);

export const hasApiKey = Boolean(
  process.env.AI_API_KEY || process.env.DEEPSEEK_API_KEY
);
