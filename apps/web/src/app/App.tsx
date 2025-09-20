import { useState } from "react";
import AddEntryModal from "@/features/entries/components/AddEntryModal";
import LoginView from "@/features/auth/components/LoginView";
import { useAuth } from "@/features/auth/hooks/useAuth";
import StudyCard from "@/features/study/components/StudyCard";
import { useStudySession } from "@/features/study/hooks/useStudySession";
import { useEntryCreation } from "@/features/entries/hooks/useEntryCreation";
import Header from "@/app/components/Header";

const App = () => {
  const { status, user, signOut } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const entry = useEntryCreation();
  const [isSignOutLoading, setIsSignOutLoading] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const {
    currentItem: currentStudyItem,
    isActive: isStudyActive,
    isRevealed: isCardRevealed,
    isSubmitting: isRatingSubmitting,
    error: studyError,
    start: startStudy,
    reveal: revealStudyCard,
    rate: handleRate,
  } = useStudySession();

  const openModal = () => {
    setIsModalOpen(true);
    entry.reset();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    entry.reset();
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

  // study logic moved into useStudySession hook

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
      <Header
        onSignOut={handleSignOut}
        isSignOutLoading={isSignOutLoading}
        signOutError={signOutError}
        onOpenModal={openModal}
      />

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
              onReveal={revealStudyCard}
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
        entryText={entry.entryText}
        isSubmitting={entry.isSubmitting}
        submissionError={entry.submissionError}
        generationResult={entry.generationResult}
        submittedEntry={entry.submittedEntry}
        isFlipped={entry.isFlipped}
        onClose={closeModal}
        onEntryChange={entry.onEntryChange}
        onSubmit={entry.onSubmit}
        onAddAnother={entry.onAddAnother}
        alreadyExists={entry.alreadyExists}
      />
    </div>
  );
};

export default App;
