const TechStackTags = ({ techStack }: TechStackTagsProps) => {
  if (!techStack?.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {techStack.slice(0, 3).map((tech) => (
        <span
          key={tech}
          className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-light-100/80"
        >
          {tech}
        </span>
      ))}
      {techStack.length > 3 && (
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-light-100/50">
          +{techStack.length - 3}
        </span>
      )}
    </div>
  );
};

export default TechStackTags;
