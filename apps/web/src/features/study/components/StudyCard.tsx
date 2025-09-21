import { useMemo } from "react";
import type { Rating, StudyItem } from "@/features/study/types";
import Button from "@/app/components/Button";

type StudyCardProps = {
  item: StudyItem;
  isRevealed: boolean;
  isSubmitting: boolean;
  onReveal: () => void;
  onRate: (rating: Rating) => void;
};

export default function StudyCard({
  item,
  isRevealed,
  isSubmitting,
  onReveal,
  onRate,
}: StudyCardProps) {
  const hasExamples = useMemo(() => item.examples?.length > 0, [item.examples]);

  return (
    <div className="w-full h-full max-w-3xl">
      <div className="[perspective:1100px]">
        <div
          className={`relative min-h-[80dvh] w-full transition-transform duration-300 ease-linear [transform-style:preserve-3d] ${
            isRevealed ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          {/* Front */}
          <div className="absolute inset-0 flex flex-col pixel-border pixel-study-surface pixel-shadow p-8 text-[var(--text)] rounded-none [backface-visibility:hidden] font-card">
            <h2 className="text-4xl font-bold text-center break-words">
              {item.expression}
            </h2>
            <div className="mt-auto flex justify-center">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={onReveal}
                disabled={isSubmitting}
                className="font-ui"
              >
                Reveal
              </Button>
            </div>
          </div>

          {/* Back */}
          <div className="absolute inset-0 flex flex-col pixel-border pixel-study-surface pixel-shadow p-6 text-[var(--text)] rounded-none [backface-visibility:hidden] [transform:rotateY(180deg)] font-card">
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-sm">
              <section>
                <h3 className="text-base font-semibold font-ui">Meaning</h3>
                <p className="mt-2 break-words">{item.meaning}</p>
              </section>

              {hasExamples ? (
                <section>
                  <h3 className="text-base font-semibold font-ui">Examples</h3>
                  <ul className="mt-2 space-y-2">
                    {item.examples.map((ex, i) => (
                      <li
                        key={i}
                        className="pixel-border px-3 py-2 rounded-none break-words"
                        style={{
                          background:
                            "color-mix(in oklch, var(--study-surface), black 6%)",
                        }}
                      >
                        {ex}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section>
                <h3 className="text-base font-semibold font-ui">Tone tip</h3>
                <p className="mt-2 break-words">{item.toneTip}</p>
              </section>

              <section>
                <h3 className="text-base font-semibold font-ui">Etymology</h3>
                <p className="mt-2 break-words">{item.etymology}</p>
              </section>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-6">
              <Button
                type="button"
                variant="surface"
                size="sm"
                onClick={() => onRate("again")}
                disabled={isSubmitting}
                className="font-ui w-full"
              >
                Again
              </Button>
              <Button
                type="button"
                variant="surface"
                size="sm"
                onClick={() => onRate("hard")}
                disabled={isSubmitting}
                className="font-ui w-full"
              >
                Hard
              </Button>
              <Button
                type="button"
                variant="surface"
                size="sm"
                onClick={() => onRate("good")}
                disabled={isSubmitting}
                className="font-ui w-full"
              >
                Good
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => onRate("easy")}
                disabled={isSubmitting}
                className="font-ui w-full"
              >
                Easy
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
