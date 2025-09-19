import { useState } from "react";
import { useAuth } from "./hooks/useAuth";

const LoginView = () => {
  const { signInWithGoogle } = useAuth();
  const [isSignInLoading, setIsSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsSignInLoading(true);
    setSignInError(null);
    try {
      await signInWithGoogle();
    } catch (error) {
      setSignInError(error instanceof Error ? error.message : "Failed to sign in.");
    } finally {
      setIsSignInLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-6 text-slate-100">
      <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-slate-800 bg-slate-900/70 px-10 py-12 shadow-2xl shadow-slate-900/60">
        <h1 className="text-3xl font-semibold text-sky-300">Sign in</h1>
        <p className="text-center text-sm text-slate-300">Continue with Google to access your workspace.</p>
        <button
          type="button"
          onClick={handleSignIn}
          className="flex w-full items-center justify-center gap-3 rounded-full bg-sky-500 px-6 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-sky-900/50 transition hover:bg-sky-400 disabled:opacity-60"
          disabled={isSignInLoading}
        >
          Continue with Google
        </button>
        {signInError ? (
          <p className="text-sm text-rose-400" role="alert">
            {signInError}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default LoginView;
