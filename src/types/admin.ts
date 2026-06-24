export type Problem = {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  order: number;
  videoId?: string;
  tags: string[];
  likes?: string[];
  dislikes?: string[];
  stars?: string[];
};
