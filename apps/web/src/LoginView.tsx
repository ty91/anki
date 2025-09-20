import { useState, type FormEvent } from "react";
import { useAuth } from "./hooks/useAuth";

const LoginView = () => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const trimmedUserId = userId.trim();
      const trimmedPassword = password;
      const trimmedEmail = email.trim();
      if (!trimmedUserId || !trimmedPassword) {
        throw new Error("User id and password are required.");
      }
      if (mode === "sign-in") {
        await signIn({ userId: trimmedUserId, password: trimmedPassword });
      } else {
        await signUp({ userId: trimmedUserId, password: trimmedPassword, email: trimmedEmail || undefined });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-6 text-slate-100">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-slate-800 bg-slate-900/70 px-10 py-12 shadow-2xl shadow-slate-900/60">
        <h1 className="text-3xl font-semibold text-sky-300 text-center">
          {mode === "sign-in" ? "Sign in" : "Create account"}
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-300">User ID</span>
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-slate-100 outline-none focus:border-sky-500"
              placeholder="yourid"
              autoComplete="username"
            />
          </label>

          {mode === "sign-up" ? (
            <label className="flex flex-col gap-1">
              <span className="text-sm text-slate-300">Email (optional)</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-slate-100 outline-none focus:border-sky-500"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>
          ) : null}

          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-300">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-slate-100 outline-none focus:border-sky-500"
              placeholder="••••••••"
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            />
          </label>

          <button
            type="submit"
            className="mt-2 rounded-full bg-sky-500 px-6 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-sky-900/50 transition hover:bg-sky-400 disabled:opacity-60"
            disabled={isLoading}
          >
            {isLoading ? (mode === "sign-in" ? "Signing in..." : "Creating...") : mode === "sign-in" ? "Sign in" : "Sign up"}
          </button>
        </form>

        <div className="text-center text-sm text-slate-300">
          {mode === "sign-in" ? (
            <button type="button" className="text-sky-300 hover:underline" onClick={() => setMode("sign-up")}>
              Create a new account
            </button>
          ) : (
            <button type="button" className="text-sky-300 hover:underline" onClick={() => setMode("sign-in")}>
              Already have an account? Sign in
            </button>
          )}
        </div>

        {error ? (
          <p className="text-sm text-rose-400 text-center" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default LoginView;
