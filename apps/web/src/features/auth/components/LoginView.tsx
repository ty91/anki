import { useState, type FormEvent } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";

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
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-6 text-[var(--text)] font-ui">
      <div className="flex w-full max-w-md flex-col gap-6 pixel-border pixel-surface pixel-shadow px-10 py-12">
        <h1 className="text-3xl font-bold text-center text-[var(--primary)]">
          {mode === "sign-in" ? "Sign in" : "Create account"}
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm opacity-80">User ID</span>
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="pixel-border pixel-surface pixel-focus px-4 py-2 text-[var(--text)] rounded-none"
              placeholder="yourid"
              autoComplete="username"
            />
          </label>

          {mode === "sign-up" ? (
            <label className="flex flex-col gap-1">
              <span className="text-sm opacity-80">Email (optional)</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pixel-border pixel-surface pixel-focus px-4 py-2 text-[var(--text)] rounded-none"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>
          ) : null}

          <label className="flex flex-col gap-1">
            <span className="text-sm opacity-80">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pixel-border pixel-surface pixel-focus px-4 py-2 text-[var(--text)] rounded-none"
              placeholder="••••••••"
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            />
          </label>

          <button
            type="submit"
            className="mt-2 pixel-border pixel-primary pixel-shadow px-6 py-3 text-base font-bold rounded-none transition-colors disabled:opacity-60"
            disabled={isLoading}
          >
            {isLoading ? (mode === "sign-in" ? "Signing in..." : "Creating...") : mode === "sign-in" ? "Sign in" : "Sign up"}
          </button>
        </form>

        <div className="text-center text-sm opacity-80">
          {mode === "sign-in" ? (
            <button type="button" className="text-[var(--primary)] underline-offset-4 hover:underline" onClick={() => setMode("sign-up")}>
              Create a new account
            </button>
          ) : (
            <button type="button" className="text-[var(--primary)] underline-offset-4 hover:underline" onClick={() => setMode("sign-in")}>
              Already have an account? Sign in
            </button>
          )}
        </div>

        {error ? (
          <p className="text-sm text-center" style={{ color: "var(--muted)" }} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default LoginView;
