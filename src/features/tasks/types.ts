export type ReadinessLevel = "draft" | "working" | "ready" | "priority";
export type TaskStatus = "draft" | "published";
export type ProposalStatus = "pending" | "selected" | "rejected";

export type TaskFields = {
  title: string;
  industry: string;
  context: string;
  need: string;
  users: string;
  dataMaterials: string;
  constraints: string;
  expectedOutcome: string;
  successCriteria: string;
  contact: string;
  interactionFormat: string;
};

export type BusinessTask = TaskFields & {
  id: string;
  score: number;
  readinessLevel: ReadinessLevel;
  status: TaskStatus;
  confirmedAt?: string;
};

export type TeamProfile = {
  id: string;
  name: string;
  interests: string[];
  skills: string[];
  technologies: string[];
};

export type Proposal = {
  id: string;
  taskId: string;
  teamId: string;
  idea: string;
  plan: string;
  timeline: string;
  prototypeUrl: string;
  status: ProposalStatus;
  createdAt: string;
};
