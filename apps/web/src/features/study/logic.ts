import type { Rating, StudyItem } from "@/features/study/types";

// Compute the next session queue based on the rating and remaining items.
export function computeNextQueue(
  current: StudyItem,
  rest: StudyItem[],
  rating: Rating
): StudyItem[] {
  if (rating === "again" || rating === "hard") {
    // Space the card out instead of showing immediately again.
    // Use a small offset; cap within bounds of the remaining queue.
    const offset = rating === "again" ? 2 : 4;
    if (rest.length === 0) {
      // If no other items remain, keep it for another round.
      return [current];
    }
    const insertAt = Math.min(offset, rest.length);
    return [
      ...rest.slice(0, insertAt),
      current,
      ...rest.slice(insertAt),
    ];
  }
  // good/easy: move on without reinserting current
  return rest;
}
