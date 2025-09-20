import { type FormEvent } from "react";
import type { GenerateResponse } from "@/features/entries/types";

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
  onAddAnother: () => void;
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
  onAddAnother,
}: AddEntryModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="[perspective:1600px]">
          <div
            className={`relative min-h-[22rem] w-full transition-transform duration-500 [transform-style:preserve-3d] ${
              isFlipped ? "[transform:rotateY(180deg)]" : ""
            }`}
          >
            <div className="absolute inset-0 flex flex-col rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-2xl [backface-visibility:hidden]">
              <h2 id="entry-modal-title" className="text-2xl font-semibold text-sky-200">
                Add a new entry
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                Enter an English word, idiom, or collocation to study later.
              </p>

              <form className="mt-6 flex flex-1 flex-col" onSubmit={onSubmit}>
                <label className="block text-sm font-medium text-slate-300">
                  Entry
                  <input
                    type="text"
                    value={entryText}
                    onChange={(event) => onEntryChange(event.target.value)}
                    placeholder="e.g. break the ice"
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
                    autoFocus
                    required
                    disabled={isSubmitting}
                  />
                </label>

                {submissionError ? (
                  <p className="mt-3 text-sm text-rose-400">{submissionError}</p>
                ) : null}

                <div className="mt-auto flex justify-end gap-3 pt-6">
                  <button
                    type="button"
                    className="rounded-full border border-slate-600 px-5 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-slate-200"
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-sky-500 px-6 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-sky-900/30 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-sky-500/60"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Generating..." : "Submit"}
                  </button>
                </div>
              </form>
            </div>

            <div className="absolute inset-0 flex flex-col rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <h2 className="text-2xl font-semibold text-sky-200">Generated entry</h2>

              {alreadyExists ? (
                <p className="mt-1 text-xs text-amber-300">This entry is already in your list. Showing saved content.</p>
              ) : null}

              {submittedEntry ? (
                <p className="mt-2 text-sm text-slate-400">Result for “{submittedEntry}”.</p>
              ) : null}

              <div className="mt-6 flex-1 space-y-5 overflow-y-auto pr-1 text-sm">
                <section>
                  <h3 className="text-base font-semibold text-slate-200">Meaning</h3>
                  <p className="mt-2 text-slate-300">{generationResult?.meaning}</p>
                </section>

                <section>
                  <h3 className="text-base font-semibold text-slate-200">Example sentences</h3>
                  <ul className="mt-2 space-y-2 text-slate-300">
                    {generationResult?.examples?.map((example, index) => (
                      <li key={index} className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2">
                        {example}
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h3 className="text-base font-semibold text-slate-200">Tone tip</h3>
                  <p className="mt-2 text-slate-300">{generationResult?.toneTip}</p>
                </section>

                <section>
                  <h3 className="text-base font-semibold text-slate-200">Etymology</h3>
                  <p className="mt-2 text-slate-300">{generationResult?.etymology}</p>
                </section>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  className="rounded-full border border-slate-600 px-5 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-slate-200"
                  onClick={onClose}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="rounded-full bg-sky-500 px-6 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-sky-900/30 transition hover:bg-sky-400"
                  onClick={onAddAnother}
                >
                  Add another
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEntryModal;
