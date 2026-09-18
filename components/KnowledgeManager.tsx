"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteDoc, listDocs, saveDoc } from "@/lib/knowledge";
import { retrieveContext } from "@/lib/rag";
import { cn } from "@/lib/utils";

const KnowledgeManager = () => {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<{
    text: string;
    sources: string[];
    hitCount: number;
  } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => setDocs(listDocs());

  useEffect(() => {
    refresh();
    setLoaded(true);
  }, []);

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("标题和内容都要填");
      return;
    }
    saveDoc({ title, content });
    setTitle("");
    setContent("");
    refresh();
    toast.success("已加入知识库");
  };

  const handleFile = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("文件太大了，建议控制在 2MB 以内");
      return;
    }
    const text = await file.text();
    saveDoc({
      title: file.name.replace(/\.(txt|md|markdown)$/i, ""),
      content: text,
    });
    refresh();
    toast.success(`已导入 ${file.name}`);
  };

  const handleSearch = () => {
    if (!query.trim()) {
      toast.error("先输入要检索的内容");
      return;
    }
    if (!docs.length) {
      toast.error("知识库还是空的");
      return;
    }
    const result = retrieveContext(docs, query, 4);
    setPreview(result);
    if (!result.hitCount) toast.message("没有命中任何片段");
  };

  const totalChars = docs.reduce((sum, doc) => sum + doc.content.length, 0);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="kb-title">标题</Label>
          <Input
            id="kb-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例如：某公司前端实习 JD"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="kb-content">内容</Label>
          <textarea
            id="kb-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={6}
            placeholder="粘贴 JD / 简历 / 面经 / 技术笔记…"
            className="w-full resize-y rounded-2xl border border-white/10 bg-dark-200 px-4 py-3 text-sm leading-7 text-light-100 outline-none placeholder:text-light-100/35 focus:border-primary-200/60"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button className="btn-primary" onClick={handleSave}>
            加入知识库
          </Button>

          <Button
            variant="outline"
            onClick={() => fileRef.current?.click()}
          >
            导入 .txt / .md
          </Button>

          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md,.markdown,text/plain,text/markdown"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFile(file);
              event.target.value = "";
            }}
          />

          <span className="text-sm text-light-100/50">
            共 {docs.length} 篇 · {totalChars} 字
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-lg">检索测试</h3>
        <p className="text-sm text-light-100/60">
          面试前先试试你的材料能不能被检索到（BM25 稀疏检索，中文按 bigram 切分）。
        </p>

        <div className="flex gap-3">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSearch();
            }}
            placeholder="例如：React 性能优化"
          />
          <Button variant="outline" onClick={handleSearch}>
            检索
          </Button>
        </div>

        {preview && (
          <div className="flex flex-col gap-3 rounded-2xl border border-primary-200/20 bg-primary-200/[0.06] p-5">
            <p className="text-sm text-light-100/70">
              命中 {preview.hitCount} 个片段，来自：
              {preview.sources.join("、") || "无"}
            </p>
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap text-xs leading-6 text-light-100/80">
              {preview.text || "（没有命中）"}
            </pre>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-lg">已入库文档</h3>

        {!loaded ? (
          <p className="text-light-100/60">加载中…</p>
        ) : docs.length === 0 ? (
          <div className="card-border w-full">
            <div className="dark-gradient flex min-h-32 items-center justify-center rounded-2xl p-8 text-center text-light-100/60">
              知识库还是空的，先加一篇 JD 或你的简历试试。
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className={cn(
                  "flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                )}
              >
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-light-100">
                    {doc.title}
                  </span>
                  <span className="text-xs text-light-100/50">
                    {doc.content.length} 字 ·{" "}
                    {new Date(doc.createdAt).toLocaleString("zh-CN")}
                  </span>
                  <p className="mt-1 line-clamp-2 text-sm text-light-100/60">
                    {doc.content.slice(0, 160)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    deleteDoc(doc.id);
                    refresh();
                    setPreview(null);
                    toast.message("已删除");
                  }}
                  className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-xs text-light-100/60 transition hover:border-rose-400/40 hover:text-rose-300"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default KnowledgeManager;
