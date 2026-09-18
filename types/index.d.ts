type InterviewStatus = "created" | "in-progress" | "completed";

type InterviewType = "technical" | "behavioral" | "mixed";

interface InterviewTurn {
  question: string;
  answer: string;
  comment: string;
  followUp?: string;
  followUpAnswer?: string;
}

interface CategoryScore {
  name: string;
  score: number;
  comment: string;
}

interface Feedback {
  totalScore: number;
  categoryScores: CategoryScore[];
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment: string;
  createdAt: string;
}

interface Interview {
  id: string;
  roleId: string;
  role: string;
  level: string;
  type: InterviewType;
  techstack: string[];
  questions: string[];
  createdAt: string;
  status: InterviewStatus;
  turns: InterviewTurn[];
  feedback?: Feedback;
}

interface RolePreset {
  id: string;
  name: string;
  emoji: string;
  description: string;
  techstack: string[];
  fallbackQuestions: string[];
}

interface InterviewCardProps {
  interview: Interview;
}

interface TechStackTagsProps {
  techStack: string[];
}

interface CreateInterviewPayload {
  roleId: string;
  role: string;
  level: string;
  type: InterviewType;
  techstack: string[];
  amount: number;
  jd?: string;
  context?: string;
  contextSources?: string[];
}

interface KnowledgeDoc {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
}
