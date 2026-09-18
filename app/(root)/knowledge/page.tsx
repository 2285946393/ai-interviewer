import KnowledgeManager from "@/components/KnowledgeManager";

const Page = () => {
  return (
    <>
      <section className="flex flex-col gap-2">
        <h2>知识库</h2>
        <p className="text-light-100/70">
          把你自己的材料放进来——岗位 JD、简历、面经、技术笔记。
          创建面试时会用 BM25 检索出最相关的片段喂给 AI，让题目和点评贴着你的真实经历走。
        </p>
      </section>

      <KnowledgeManager />
    </>
  );
};

export default Page;
