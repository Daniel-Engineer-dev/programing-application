export type ProblemFormData = {
  id?: string; // Custom ID for new problems
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
  description: string;
  constraints: string[];
  defaultCode: { cpp: string; java: string; python: string; javascript: string };
  driverCodes: { cpp: string; java: string; python: string; javascript: string };
  examples: { input: string; output: string; explanation: string }[];
  testCases: { input: string; output: string; isHidden?: boolean }[]; 
  editorial: {
    content: string;
    videoUrl: string;
    approaches: {
      name: string;
      description: string;
      code: { cpp: string; java: string; python: string; javascript: string };
      timeComplexity: string;
      spaceComplexity: string;
    }[];
  };
  acceptance?: number;
  likes?: string[];
  dislikes?: string[];
  stars?: string[];
};

export const INITIAL_PROBLEM_DATA: ProblemFormData = {
  id: "",
  title: "",
  difficulty: "Easy",
  tags: [],
  description: "",
  constraints: [""],
  defaultCode: { cpp: "", java: "", python: "", javascript: "" },
  driverCodes: { cpp: "", java: "", python: "", javascript: "" },
  examples: [{ input: "", output: "", explanation: "" }],
  testCases: [],
  editorial: {
    content: "",
    videoUrl: "",
    approaches: [],
  },
  acceptance: 0,
  likes: [],
  dislikes: [],
  stars: [],
};
