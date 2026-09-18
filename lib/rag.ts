export interface Chunk {
  id: string;
  docId: string;
  docTitle: string;
  text: string;
  index: number;
}

interface IndexedChunk extends Chunk {
  tokens: string[];
}

const CJK = /[\u4e00-\u9fa5]/;

export function tokenize(text: string): string[] {
  const segments = text
    .toLowerCase()
    .split(/[^\u4e00-\u9fa5a-z0-9]+/)
    .filter(Boolean);

  const tokens: string[] = [];

  for (const segment of segments) {
    if (CJK.test(segment)) {
      if (segment.length === 1) {
        tokens.push(segment);
        continue;
      }
      for (let i = 0; i < segment.length - 1; i += 1) {
        tokens.push(segment.slice(i, i + 2));
      }
    } else {
      tokens.push(segment);
    }
  }

  return tokens;
}

export function chunkText(text: string, size = 420, overlap = 80): string[] {
  const clean = text.replace(/\r/g, "").trim();
  if (!clean) return [];
  if (clean.length <= size) return [clean];

  const chunks: string[] = [];
  let start = 0;

  while (start < clean.length) {
    let end = Math.min(start + size, clean.length);

    if (end < clean.length) {
      const window = clean.slice(start, end);
      const cut = Math.max(
        window.lastIndexOf("\n"),
        window.lastIndexOf("。"),
        window.lastIndexOf("；"),
        window.lastIndexOf(". ")
      );
      if (cut > size * 0.5) end = start + cut + 1;
    }

    const piece = clean.slice(start, end).trim();
    if (piece) chunks.push(piece);
    if (end >= clean.length) break;

    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}

export function buildChunks(docs: KnowledgeDoc[]): IndexedChunk[] {
  const chunks: IndexedChunk[] = [];

  for (const doc of docs) {
    chunkText(doc.content).forEach((text, index) => {
      chunks.push({
        id: `${doc.id}-${index}`,
        docId: doc.id,
        docTitle: doc.title,
        text,
        index,
        tokens: tokenize(text),
      });
    });
  }

  return chunks;
}

export class BM25Index {
  private chunks: IndexedChunk[];
  private idf = new Map<string, number>();
  private avgdl = 0;
  private readonly k1 = 1.5;
  private readonly b = 0.75;

  constructor(chunks: IndexedChunk[]) {
    this.chunks = chunks;

    const df = new Map<string, number>();
    let total = 0;

    for (const chunk of chunks) {
      total += chunk.tokens.length;
      for (const token of new Set(chunk.tokens)) {
        df.set(token, (df.get(token) ?? 0) + 1);
      }
    }

    this.avgdl = chunks.length ? total / chunks.length : 1;
    const N = chunks.length || 1;

    for (const [token, freq] of df) {
      this.idf.set(
        token,
        Math.log(1 + (N - freq + 0.5) / (freq + 0.5))
      );
    }
  }

  search(query: string, topK = 4) {
    const queryTokens = [...new Set(tokenize(query))];
    if (!queryTokens.length || !this.chunks.length) return [];

    const scored = this.chunks.map((chunk) => {
      const freq = new Map<string, number>();
      for (const token of chunk.tokens) {
        freq.set(token, (freq.get(token) ?? 0) + 1);
      }

      let score = 0;
      const dl = chunk.tokens.length || 1;

      for (const token of queryTokens) {
        const f = freq.get(token);
        if (!f) continue;
        const idf = this.idf.get(token) ?? 0;
        score +=
          (idf * (f * (this.k1 + 1))) /
          (f + this.k1 * (1 - this.b + (this.b * dl) / this.avgdl));
      }

      return { chunk, score };
    });

    return scored
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}

export interface RetrievedContext {
  text: string;
  sources: string[];
  hitCount: number;
}

export function retrieveContext(
  docs: KnowledgeDoc[],
  query: string,
  topK = 4
): RetrievedContext {
  if (!docs.length) return { text: "", sources: [], hitCount: 0 };

  const index = new BM25Index(buildChunks(docs));
  const hits = index.search(query, topK);

  if (!hits.length) return { text: "", sources: [], hitCount: 0 };

  const text = hits
    .map(
      ({ chunk }, i) =>
        `【片段 ${i + 1}｜来源：${chunk.docTitle}】\n${chunk.text}`
    )
    .join("\n\n");

  const sources = [...new Set(hits.map((hit) => hit.chunk.docTitle))];

  return { text, sources, hitCount: hits.length };
}
