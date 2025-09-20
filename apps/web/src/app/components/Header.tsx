type HeaderProps = {
  onSignOut: () => void;
  isSignOutLoading: boolean;
  signOutError: string | null;
  onOpenModal: () => void;
};

export default function Header({ onSignOut, isSignOutLoading, signOutError, onOpenModal }: HeaderProps) {
  return (
    <header className="mx-auto w-full max-w-3xl">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={onSignOut}
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
        onClick={onOpenModal}
      >
        +
      </button>
    </header>
  );
}

