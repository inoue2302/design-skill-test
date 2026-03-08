import { cn } from "@/lib/utils";

type ProgressBarProps = {
  currentQuestion: number;
  totalQuestions: number;
};

const QUESTION_LABELS = ["Q1", "Q2", "Q3", "Q4", "Q5"] as const;

export function ProgressBar({
  currentQuestion,
  totalQuestions,
}: ProgressBarProps) {
  return (
    <div className="flex items-center gap-2">
      {QUESTION_LABELS.slice(0, totalQuestions).map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={cn(
              "flex size-8 items-center justify-center rounded-full text-xs font-bold transition-colors",
              i < currentQuestion
                ? "bg-primary text-white"
                : i === currentQuestion
                  ? "bg-secondary text-white"
                  : "bg-border text-text-sub"
            )}
          >
            {label}
          </div>
          {i < totalQuestions - 1 && (
            <div
              className={cn(
                "h-0.5 w-6 transition-colors",
                i < currentQuestion ? "bg-primary" : "bg-border"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
