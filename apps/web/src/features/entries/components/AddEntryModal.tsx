import { type FormEvent } from "react";
import type { GenerateResponse } from "@/features/entries/types";
import Button from "@/app/components/Button";

type AddEntryModalProps = {
  isOpen: boolean;
  entryText: string;
  isSubmitting: boolean;
  submissionError: string | null;
  generationResult: GenerateResponse | null;
  submittedEntry: string | null;
  isFlipped: boolean;
  alreadyExists?: boolean;
  onClose: () => void;
  onEntryChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const AddEntryModal = ({
  isOpen,
  entryText,
  isSubmitting,
  submissionError,
  generationResult,
  submittedEntry,
  isFlipped,
  alreadyExists,
  onClose,
  onEntryChange,
  onSubmit,
}: AddEntryModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
      style={{
        backgroundColor: "color-mix(in oklch, var(--ink), transparent 35%)",
      }}
    >
      <div
        className="w-full max-w-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="[perspective:1600px] font-card">
          <div
            className={`relative h-[75vh] max-h-[85vh] min-h-[28rem] w-full transition-transform duration-500 [transform-style:preserve-3d] ${
              isFlipped ? "[transform:rotateY(180deg)]" : ""
            }`}
          >
            <div className="absolute inset-0 flex flex-col pixel-border pixel-surface pixel-shadow p-6 text-[var(--text)] rounded-none [backface-visibility:hidden]">
              <h2
                id="entry-modal-title"
                className="text-2xl font-bold text-[var(--primary)] font-ui"
              >
                Add a new entry
              </h2>

              <p className="mt-2 text-sm opacity-80">
                Enter an English word, idiom, or collocation to study later.
              </p>

              <form className="mt-6 flex flex-1 flex-col" onSubmit={onSubmit}>
                <label className="block text-sm font-medium opacity-90 font-ui">
                  Entry
                  <input
                    type="text"
                    value={entryText}
                    onChange={(event) => onEntryChange(event.target.value)}
                    placeholder="e.g. break the ice"
                    className="mt-2 w-full pixel-border pixel-surface pixel-focus px-4 py-3 text-base text-[var(--text)] font-card placeholder:opacity-60 rounded-none"
                    autoFocus
                    required
                    disabled={isSubmitting}
                  />
                </label>

                {submissionError ? (
                  <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
                    {submissionError}
                  </p>
                ) : null}

                <div className="flex justify-end gap-3 pt-6">
                  <Button
                    type="button"
                    variant="surface"
                    size="sm"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="font-ui"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSubmitting}
                    className="font-ui"
                  >
                    {isSubmitting ? "Generating..." : "Submit"}
                  </Button>
                </div>
              </form>
            </div>

            <div className="absolute inset-0 flex flex-col pixel-border pixel-surface pixel-shadow p-6 text-[var(--text)] rounded-none [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <h2 className="text-2xl font-bold text-[var(--primary)] font-ui">
                {submittedEntry}
              </h2>

              {alreadyExists ? (
                <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                  This entry is already in your list. Showing saved content.
                </p>
              ) : null}

              <div className="mt-6 flex-1 space-y-5 overflow-y-auto pr-1 text-sm">
                <section>
                  <h3 className="text-base font-semibold opacity-90">
                    Meaning
                  </h3>
                  <p className="mt-2 opacity-90">{generationResult?.meaning}</p>
                </section>

                <section>
                  <h3 className="text-base font-semibold opacity-90">
                    Example sentences
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {generationResult?.examples?.map((example, index) => (
                      <li
                        key={index}
                        className="pixel-border pixel-surface px-3 py-2 rounded-none"
                      >
                        {example}
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h3 className="text-base font-semibold opacity-90">
                    Tone tip
                  </h3>
                  <p className="mt-2 opacity-90">{generationResult?.toneTip}</p>
                </section>

                <section>
                  <h3 className="text-base font-semibold opacity-90">
                    Etymology
                  </h3>
                  <p className="mt-2 opacity-90">
                    {generationResult?.etymology}
                  </p>
                </section>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="surface"
                  size="sm"
                  onClick={onClose}
                  className="font-ui"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEntryModal;
