const STORAGE_KEY = "ai-interviewer:knowledge:v1";

function readAll(): KnowledgeDoc[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as KnowledgeDoc[]) : [];
  } catch {
    return [];
  }
}

function writeAll(list: KnowledgeDoc[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (error) {
    console.error("保存知识库失败", error);
  }
}

export function listDocs(): KnowledgeDoc[] {
  return readAll().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getDocs(ids: string[]): KnowledgeDoc[] {
  if (!ids.length) return [];
  const set = new Set(ids);
  return readAll().filter((doc) => set.has(doc.id));
}

export function saveDoc(input: {
  title: string;
  content: string;
  tags?: string[];
}): KnowledgeDoc {
  const doc: KnowledgeDoc = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `kb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: input.title.trim() || "未命名文档",
    content: input.content.trim(),
    tags: input.tags ?? [],
    createdAt: new Date().toISOString(),
  };

  writeAll([doc, ...readAll()]);
  return doc;
}

export function deleteDoc(id: string) {
  writeAll(readAll().filter((doc) => doc.id !== id));
}
