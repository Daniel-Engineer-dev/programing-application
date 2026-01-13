import { fetchContestDetailsServer } from "./lib/fetchContest";
import ContestCountdown from "./components/ContestCountdown";

function parseWeirdTimeString(input: any): Date {
  if (!input) return new Date();
  if (input.toMillis) return new Date(input.toMillis());
  if (typeof input === "number") return new Date(input);
  
  let s = String(input).replace(" at ", " ");
  s = s.replace(/UTC([+-]\d+)/, "GMT$1");
  s = s.replace(/\u202F/g, " ");
  const d = new Date(s);
  if (isNaN(d.getTime())) { 
      // Fallback or specific format
      return new Date(); 
  }
  return d;
}

export default async function ContestLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contest = await fetchContestDetailsServer(id);

  if (!contest) {
      return <>{children}</>;
  }

  const d = parseWeirdTimeString(contest.time || contest.startTime || contest.startAt);

  return (
    <>
      {children}
      <ContestCountdown
        contestId={id}
        realStartTime={d.getTime()}
        lengthMinutes={contest.length || 180}
      />
    </>
  );
}
