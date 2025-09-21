import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import Button from "@/app/components/Button";
import ExpressionDetailModal from "@/features/entries/components/ExpressionDetailModal";

type Row = { id: number; expression: string };

type ExpressionsPanelProps = {
  onClose: () => void;
};

export default function ExpressionsPanel({ onClose }: ExpressionsPanelProps) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await trpc.entries.list.query();
        if (!cancelled) setRows(data as Row[]);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load expressions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="w-full max-w-2xl pixel-border pixel-study-surface pixel-shadow p-4 md:p-6 rounded-none">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-ui text-2xl font-bold text-[var(--primary)]">Expressions</h2>
        <Button variant="surface" size="sm" onClick={onClose} className="shrink-0">Close</Button>
      </div>

      <div className="mt-4 h-[60vh] md:h-[66vh] overflow-y-auto pr-1">
        {loading ? (
          <p className="text-sm opacity-80">Loading…</p>
        ) : error ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>{error}</p>
        ) : rows && rows.length > 0 ? (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li
                key={row.id}
                className="pixel-border pixel-surface rounded-none px-3 py-2 font-card break-words cursor-pointer hover:underline"
                onClick={() => setSelectedId(row.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(row.id); } }}
                aria-label={`Open details for ${row.expression}`}
              >
                {row.expression}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm opacity-80">No expressions yet. Add one to get started.</p>
        )}
      </div>
      <ExpressionDetailModal id={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
