import type { Rating, StudyItem } from "@/features/study/types";

// Compute the next session queue based on the rating and remaining items.
export function computeNextQueue(
  current: StudyItem,
  rest: StudyItem[],
  rating: Rating
): StudyItem[] {
  if (rating === "again" || rating === "hard") {
    if (rest.length > 0) {
      const insertAt = Math.min(rating === "again" ? 0 : 1, rest.length);
      return [
        ...rest.slice(0, insertAt),
        current,
        ...rest.slice(insertAt),
      ];
    }
    return [];
  }
  // good/easy: move on without reinserting current
  return rest.length > 0 ? rest : [];
}

