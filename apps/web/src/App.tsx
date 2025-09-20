import { type FormEvent, useState } from "react";
import AddEntryModal, { type GenerateResponse } from "./AddEntryModal";
import LoginView from "./LoginView";
import { useAuth } from "./hooks/useAuth";
import { trpc } from "./trpcClient";
import StudyCard, { type Rating, type StudyItem } from "./StudyCard";

const App = () => {
  const { status, user, signOut } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entryText, setEntryText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [generationResult, setGenerationResult] =
    useState<GenerateResponse | null>(null);
  const [submittedEntry, setSubmittedEntry] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [isSignOutLoading, setIsSignOutLoading] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [studyItems, setStudyItems] = useState<StudyItem[]>([]);
  const [isStudyActive, setIsStudyActive] = useState(false);
  const [isCardRevealed, setIsCardRevealed] = useState(false);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);
  const [studyError, setStudyError] = useState<string | null>(null);

  const openModal = () => {
    setIsModalOpen(true);
    setEntryText("");
    setSubmissionError(null);
    setGenerationResult(null);
    setSubmittedEntry(null);
    setIsFlipped(false);
    setAlreadyExists(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsSubmitting(false);
    setSubmissionError(null);
    setGenerationResult(null);
    setSubmittedEntry(null);
    setIsFlipped(false);
    setEntryText("");
    setAlreadyExists(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEntry = entryText.trim();

    if (!trimmedEntry) {
      setSubmissionError("Entry cannot be empty.");
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

  const prepareAnotherEntry = () => {
    setGenerationResult(null);
    setSubmittedEntry(null);
    setSubmissionError(null);
    setIsFlipped(false);
    setEntryText("");
  };

  const handleSignOut = async () => {
    setIsSignOutLoading(true);
    setSignOutError(null);
    try {
      await signOut();
    } catch (error) {
      setSignOutError(
        error instanceof Error ? error.message : "Failed to sign out."
      );
    } finally {
      setIsSignOutLoading(false);
    }
  };

  const startStudy = async () => {
    setStudyError(null);
    try {
      const data = await trpc.anki.start.query();
      const items = data.items as StudyItem[];
      setStudyItems(items);
      setIsStudyActive(true);
      setIsCardRevealed(false);
    } catch (error) {
      setStudyError(
        error instanceof Error ? error.message : "Failed to start session."
      );
    }
  };

  const currentStudyItem = studyItems.length > 0 ? studyItems[0] : null;

  const handleRate = async (rating: Rating) => {
    if (!currentStudyItem) return;
    setIsRatingSubmitting(true);
    setStudyError(null);
    try {
      await trpc.anki.review.mutate({ entryId: currentStudyItem.id, rating });

      const offsets: Record<Rating, number> = {
        again: 1,
        hard: 2,
        good: 3,
        easy: 5,
      };
      const offset = offsets[rating];
      const rest = studyItems.slice(1);
      if (rest.length > 0) {
        const insertAt = Math.min(offset - 1, rest.length);
        const newQueue = [
          ...rest.slice(0, insertAt),
          currentStudyItem,
          ...rest.slice(insertAt),
        ];
        setStudyItems(newQueue);
      } else {
        setStudyItems([]);
        setIsStudyActive(false);
      }
      setIsCardRevealed(false);
    } catch (error) {
      setStudyError(
        error instanceof Error ? error.message : "Failed to submit review."
      );
    } finally {
      setIsRatingSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-6 text-slate-100">
        <p className="text-sm text-slate-300">Checking your session...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 px-4 py-6 text-slate-100">
      <header className="mx-auto w-full max-w-3xl">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 shadow-sm shadow-slate-900/40 transition hover:bg-slate-800 disabled:opacity-60"
            disabled={isSignOutLoading}
          >
            Sign out
          </button>
        </div>
        {signOutError ? (
          <p className="mb-2 text-right text-xs text-rose-400" role="alert">
            {signOutError}
          </p>
        ) : null}
        <button
          type="button"
          className="flex w-full items-center justify-center rounded-2xl border border-dashed border-sky-400 bg-slate-900/50 px-6 py-8 text-5xl font-semibold text-sky-300 shadow-lg shadow-sky-900/30 transition hover:bg-slate-900 hover:text-sky-200"
          aria-label="Add new item"
          onClick={openModal}
        >
          +
        </button>
      </header>

      <main className="flex flex-1 items-center justify-center">
        {!isStudyActive ? (
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={startStudy}
              className="rounded-full bg-sky-500 px-12 py-6 text-2xl font-semibold text-slate-900 shadow-xl shadow-sky-900/40 transition hover:bg-sky-400"
            >
              Start
            </button>
            {studyError ? (
              <p className="text-sm text-rose-400" role="alert">
                {studyError}
              </p>
            ) : null}
          </div>
        ) : currentStudyItem ? (
          <div className="w-full flex flex-col items-center gap-4">
            <StudyCard
              item={currentStudyItem}
              isRevealed={isCardRevealed}
              isSubmitting={isRatingSubmitting}
              onReveal={() => setIsCardRevealed(true)}
              onRate={handleRate}
            />
            {studyError ? (
              <p className="text-sm text-rose-400" role="alert">
                {studyError}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="text-slate-300">No more due cards right now.</div>
        )}
      </main>

      <AddEntryModal
        isOpen={isModalOpen}
        entryText={entryText}
        isSubmitting={isSubmitting}
        submissionError={submissionError}
        generationResult={generationResult}
        submittedEntry={submittedEntry}
        isFlipped={isFlipped}
        onClose={closeModal}
        onEntryChange={setEntryText}
        onSubmit={handleSubmit}
        onAddAnother={prepareAnotherEntry}
        alreadyExists={alreadyExists}
      />
    </div>
  );
};

export default App;
