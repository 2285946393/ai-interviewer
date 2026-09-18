const STORAGE_KEY = "ai-interviewer:interviews:v1";

function readAll(): Interview[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Interview[]) : [];
  } catch {
    return [];
  }
}

function writeAll(list: Interview[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (error) {
    console.error("保存面试记录失败", error);
  }
}

export function listInterviews(): Interview[] {
  return readAll().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getInterview(id: string): Interview | null {
  return readAll().find((item) => item.id === id) ?? null;
}

export function createInterview(
  payload: Omit<Interview, "id" | "createdAt" | "status" | "turns">
): Interview {
  const record: Interview = {
    ...payload,
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `iv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    status: "created",
    turns: [],
  };

  writeAll([record, ...readAll()]);
  return record;
}

export function updateInterview(
  id: string,
  patch: Partial<Omit<Interview, "id">>
): Interview | null {
  const list = readAll();
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const next = { ...list[index], ...patch, id };
  list[index] = next;
  writeAll(list);
  return next;
}

export function deleteInterview(id: string) {
  writeAll(readAll().filter((item) => item.id !== id));
}

export function clearInterviews() {
  writeAll([]);
}
