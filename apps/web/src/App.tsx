import { type FormEvent, useState } from "react";
import AddEntryModal, { type GenerateResponse } from "./AddEntryModal";
import LoginView from "./LoginView";
import { useAuth } from "./hooks/useAuth";

const App = () => {
  const { status, user, signOut } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entryText, setEntryText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [generationResult, setGenerationResult] = useState<GenerateResponse | null>(null);
  const [submittedEntry, setSubmittedEntry] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSignOutLoading, setIsSignOutLoading] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const openModal = () => {
    setIsModalOpen(true);
    setEntryText("");
    setSubmissionError(null);
    setGenerationResult(null);
    setSubmittedEntry(null);
    setIsFlipped(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsSubmitting(false);
    setSubmissionError(null);
    setGenerationResult(null);
    setSubmittedEntry(null);
    setIsFlipped(false);
    setEntryText("");
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
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ entry: trimmedEntry }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Unexpected server error.");
      }

      const data = (await response.json()) as GenerateResponse;

      setGenerationResult(data);
      setSubmittedEntry(trimmedEntry);
      setEntryText("");
      setIsFlipped(true);
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : "Failed to generate entry.");
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
      setSignOutError(error instanceof Error ? error.message : "Failed to sign out.");
    } finally {
      setIsSignOutLoading(false);
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
        <button
          type="button"
          className="rounded-full bg-sky-500 px-12 py-6 text-2xl font-semibold text-slate-900 shadow-xl shadow-sky-900/40 transition hover:bg-sky-400"
        >
          Start
        </button>
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
      />
    </div>
  );
};

export default App;
