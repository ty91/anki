import { useState } from "react";
import AddEntryModal from "@/features/entries/components/AddEntryModal";
import LoginView from "@/features/auth/components/LoginView";
import { useAuth } from "@/features/auth/hooks/useAuth";
import StudyCard from "@/features/study/components/StudyCard";
import { useStudySession } from "@/features/study/hooks/useStudySession";
import { useEntryCreation } from "@/features/entries/hooks/useEntryCreation";
import Header from "@/app/components/Header";
import Button from "@/app/components/Button";

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
    close: closeStudy,
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
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-6 text-[var(--text)]">
        <p className="text-sm/6 opacity-80">Checking your session...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] px-4 py-6 text-[var(--text)] font-ui">
      {/* Top-center logo */}
      <div className="mx-auto mb-4 text-center select-none">
        <h1 className="text-4xl md:text-5xl font-bold tracking-wider text-[var(--primary)]">
          Memorize!
        </h1>
      </div>

      <Header />

      <main className="flex flex-1 items-center justify-center">
        {!isStudyActive ? (
          <div className="flex flex-col items-center gap-3 w-full px-4">
            <Button
              aria-label="Add"
              onClick={openModal}
              variant="surface"
              size="lg"
              className="w-64 max-w-[80vw]"
            >
              Add
            </Button>
            <Button
              onClick={startStudy}
              variant="primary"
              size="lg"
              className="w-64 max-w-[80vw]"
            >
              Study
            </Button>
            <Button
              variant="surface"
              size="lg"
              className="w-64 max-w-[80vw] text-base"
            >
              Expressions
            </Button>
            <Button
              variant="surface"
              size="sm"
              onClick={handleSignOut}
              className="mt-2"
              disabled={isSignOutLoading}
            >
              {isSignOutLoading ? "Signing out..." : "Sign out"}
            </Button>
            {signOutError ? (
              <p
                className="text-xs"
                style={{ color: "var(--muted)" }}
                role="alert"
              >
                {signOutError}
              </p>
            ) : null}
            {studyError ? (
              <p
                className="text-sm"
                style={{ color: "var(--muted)" }}
                role="alert"
              >
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
              <p
                className="text-sm"
                style={{ color: "var(--muted)" }}
                role="alert"
              >
                {studyError}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="w-full flex flex-col items-center gap-4">
            <div className="opacity-80">No more due cards right now.</div>
            <Button
              variant="surface"
              size="lg"
              onClick={closeStudy}
              className="w-64 max-w-[80vw]"
            >
              Done
            </Button>
          </div>
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
        alreadyExists={entry.alreadyExists}
      />
    </div>
  );
};

export default App;
