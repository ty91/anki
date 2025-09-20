import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { computeNextQueue } from "@/features/study/logic";
import type { Rating, StudyItem } from "@/features/study/types";

export function useStudySession() {
  const [items, setItems] = useState<StudyItem[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setError(null);
    try {
      const data = await trpc.anki.start.query();
      const fetched = data.items as StudyItem[];
      setItems(fetched);
      setIsActive(true);
      setIsRevealed(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start session.");
    }
  };

  const reveal = () => setIsRevealed(true);

  const rate = async (rating: Rating) => {
    const current = items.length > 0 ? items[0] : null;
    if (!current) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await trpc.anki.review.mutate({ entryId: current.id, rating });
      const rest = items.slice(1);
      const next = computeNextQueue(current, rest, rating);
      setItems(next);
      setIsActive(next.length > 0);
      setIsRevealed(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit review."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    items,
    currentItem: items.length > 0 ? items[0] : null,
    isActive,
    isRevealed,
    isSubmitting,
    error,
    start,
    reveal,
    rate,
  } as const;
}

