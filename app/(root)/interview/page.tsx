import CreateInterviewForm from "@/components/CreateInterviewForm";

const Page = () => {
  return (
    <>
      <section className="flex flex-col gap-2">
        <h2>新建一场模拟面试</h2>
        <p className="text-light-100/70">
          选好岗位和难度，AI 会为你现场出题。建议对着屏幕把答案说完整，
          面试官会根据你的回答追问。
        </p>
      </section>

      <CreateInterviewForm />
    </>
  );
};

export default Page;
