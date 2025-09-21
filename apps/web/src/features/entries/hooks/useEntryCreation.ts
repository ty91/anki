import { useState, type FormEvent } from "react";
import { trpc } from "@/lib/trpc";
import type { GenerateResponse } from "@/features/entries/types";

export function useEntryCreation() {
  const [entryText, setEntryText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [generationResult, setGenerationResult] =
    useState<GenerateResponse | null>(null);
  const [submittedEntry, setSubmittedEntry] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [alreadyExists, setAlreadyExists] = useState(false);

  const reset = () => {
    setEntryText("");
    setIsSubmitting(false);
    setSubmissionError(null);
    setGenerationResult(null);
    setSubmittedEntry(null);
    setIsFlipped(false);
    setAlreadyExists(false);
  };

  const onEntryChange = (value: string) => setEntryText(value);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEntry = entryText.trim();
    if (!trimmedEntry) {
      setSubmissionError("Expression cannot be empty.");
      return;
    }
    if (trimmedEntry.length > 100) {
      setSubmissionError("Expression must be at most 100 characters.");
      return;
    }
    setIsSubmitting(true);
    setSubmissionError(null);
    try {
      const data = await trpc.entries.add.mutate({ entry: trimmedEntry });
      setGenerationResult({
        meaning: data.entry.meaning,
        examples: data.entry.examples,
        toneTip: data.entry.toneTip,
        etymology: data.entry.etymology,
      });
      setAlreadyExists(Boolean(data.existed));
      setSubmittedEntry(trimmedEntry);
      setEntryText("");
      setIsFlipped(true);
    } catch (error) {
      setSubmissionError(
        error instanceof Error ? error.message : "Failed to generate entry."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onAddAnother = () => {
    setGenerationResult(null);
    setSubmittedEntry(null);
    setSubmissionError(null);
    setIsFlipped(false);
    setEntryText("");
  };

  return {
    entryText,
    isSubmitting,
    submissionError,
    generationResult,
    submittedEntry,
    isFlipped,
    alreadyExists,
    onEntryChange,
    onSubmit,
    onAddAnother,
    reset,
  } as const;
}
