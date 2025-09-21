import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import Button from "@/app/components/Button";

type Entry = {
  id: number;
  expression: string;
  meaning: string;
  examples: string[];
  toneTip: string;
  etymology: string;
};

type ExpressionDetailModalProps = {
  id: number | null;
  onClose: () => void;
};

export default function ExpressionDetailModal({
  id,
  onClose,
}: ExpressionDetailModalProps) {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setEntry(null);
    onClose();
  };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = (await trpc.entries.getById.query({
          id,
        })) as unknown as Entry;
        if (!cancelled) setEntry(data);
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load entry."
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm"
      onClick={handleClose}
      role="presentation"
    >
      <div
        className="w-full max-w-2xl pixel-border pixel-study-surface pixel-shadow p-6 rounded-none"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-ui text-2xl font-bold text-[var(--primary)]">
            {entry?.expression ?? "Expression"}
          </h2>
          <Button size="sm" variant="surface" onClick={handleClose}>
            Close
          </Button>
        </div>

        <div className="mt-4 h-[60vh] overflow-y-auto pr-1 space-y-5 font-card text-sm">
          {loading ? (
            <p className="mt-4 text-sm opacity-80">Loading…</p>
          ) : error ? (
            <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
              {error}
            </p>
          ) : entry ? (
            <>
              <section>
                <h3 className="font-ui text-base font-semibold">Meaning</h3>
                <p className="mt-2 break-words">{entry.meaning}</p>
              </section>
              {entry.examples?.length ? (
                <section>
                  <h3 className="font-ui text-base font-semibold">Examples</h3>
                  <ul className="mt-2 space-y-2">
                    {entry.examples.map((ex, i) => (
                      <li
                        key={i}
                        className="pixel-border px-3 py-2 rounded-none break-words"
                        style={{
                          background:
                            "color-mix(in oklch, var(--study-surface), black 6%)",
                        }}
                      >
                        {ex}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              <section>
                <h3 className="font-ui text-base font-semibold">Tone tip</h3>
                <p className="mt-2 break-words">{entry.toneTip}</p>
              </section>
              <section>
                <h3 className="font-ui text-base font-semibold">Etymology</h3>
                <p className="mt-2 break-words">{entry.etymology}</p>
              </section>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
