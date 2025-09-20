import { useMemo } from "react";

export type Rating = "again" | "hard" | "good" | "easy";

export type StudyItem = {
  id: number;
  expression: string;
  meaning: string;
  examples: string[];
  toneTip: string;
  etymology: string;
};

type StudyCardProps = {
  item: StudyItem;
  isRevealed: boolean;
  isSubmitting: boolean;
  onReveal: () => void;
  onRate: (rating: Rating) => void;
};

export default function StudyCard({ item, isRevealed, isSubmitting, onReveal, onRate }: StudyCardProps) {
  const hasExamples = useMemo(() => item.examples?.length > 0, [item.examples]);

  return (
    <div className="w-full max-w-3xl">
      <div className="[perspective:1600px]">
        <div
          className={`relative min-h-[22rem] w-full transition-transform duration-500 [transform-style:preserve-3d] ${
            isRevealed ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          {/* Front */}
          <div className="absolute inset-0 flex flex-col rounded-2xl border border-slate-700 bg-slate-900 p-8 text-slate-100 shadow-2xl [backface-visibility:hidden]">
            <h2 className="text-4xl font-bold text-sky-200 text-center break-words">
              {item.expression}
            </h2>
            <div className="mt-auto flex justify-center">
              <button
                type="button"
                className="rounded-full bg-sky-500 px-6 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-sky-900/30 transition hover:bg-sky-400"
                onClick={onReveal}
                disabled={isSubmitting}
              >
                Reveal
              </button>
            </div>
          </div>

          {/* Back */}
          <div className="absolute inset-0 flex flex-col rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <h3 className="text-base font-semibold text-slate-200">Meaning</h3>
            <p className="mt-2 text-slate-300">{item.meaning}</p>

            {hasExamples ? (
              <div className="mt-4">
                <h3 className="text-base font-semibold text-slate-200">Examples</h3>
                <ul className="mt-2 space-y-2 text-slate-300">
                  {item.examples.map((ex, i) => (
                    <li key={i} className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2">
                      {ex}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-4">
              <h3 className="text-base font-semibold text-slate-200">Tone tip</h3>
              <p className="mt-2 text-slate-300">{item.toneTip}</p>
            </div>

            <div className="mt-4">
              <h3 className="text-base font-semibold text-slate-200">Etymology</h3>
              <p className="mt-2 text-slate-300">{item.etymology}</p>
            </div>

            <div className="mt-auto grid grid-cols-4 gap-2 pt-6">
              <button
                type="button"
                className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 shadow-sm shadow-slate-900/40 transition hover:bg-slate-800 disabled:opacity-60"
                onClick={() => onRate("again")}
                disabled={isSubmitting}
              >
                Again
              </button>
              <button
                type="button"
                className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 shadow-sm shadow-slate-900/40 transition hover:bg-slate-800 disabled:opacity-60"
                onClick={() => onRate("hard")}
                disabled={isSubmitting}
              >
                Hard
              </button>
              <button
                type="button"
                className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 shadow-sm shadow-slate-900/40 transition hover:bg-slate-800 disabled:opacity-60"
                onClick={() => onRate("good")}
                disabled={isSubmitting}
              >
                Good
              </button>
              <button
                type="button"
                className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 shadow-sm shadow-slate-900/40 transition hover:bg-slate-800 disabled:opacity-60"
                onClick={() => onRate("easy")}
                disabled={isSubmitting}
              >
                Easy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
