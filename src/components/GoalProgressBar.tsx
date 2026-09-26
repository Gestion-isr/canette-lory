import { formatMoney } from "@/lib/format";
import { FundsDonut, fundsMix } from "@/components/FundsDonut";
import type { Funds, GoalProgress } from "@/lib/types";

type Part = { key: string; couleur: string; ratio: number };

export function GoalProgressBar({
  goal,
  compact = false,
  rank,
  parts,
}: {
  goal: GoalProgress;
  compact?: boolean;
  rank?: number;
  /** Provenance de l'argent : la barre est alors découpée par source. */
  parts?: Part[];
}) {
  const pct = Math.min(100, Math.round((goal.raised_amount / goal.target_amount) * 100));
  const done = goal.raised_amount >= goal.target_amount;
  const segments = (parts ?? []).filter((p) => p.ratio > 0);

  return (
    <div className={compact ? "" : "card"}>
      <div className="flex items-start gap-4">
        {goal.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={goal.image_url}
            alt={goal.title}
            className={`shrink-0 rounded-xl object-cover ring-1 ring-black/10 ${compact ? "h-20 w-20" : "h-24 w-24 sm:h-28 sm:w-28"}`}
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{rank ? `Objectif ${rank}` : "Objectif"}</p>
              <p className="text-lg font-bold text-gray-900">
                {done ? "🎉 " : "🎯 "}
                {goal.title}
              </p>
            </div>
            <p className="shrink-0 text-right text-sm text-gray-600">
              <span className="text-2xl font-extrabold text-brand-700">{formatMoney(goal.raised_amount)}</span>
              <br />
              sur {formatMoney(goal.target_amount)}
            </p>
          </div>

          <div
            className="mt-3 flex h-4 w-full overflow-hidden rounded-full bg-gray-100"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            {segments.length > 0 ? (
              segments.map((s) => (
                <div
                  key={s.key}
                  className="h-full transition-all duration-700"
                  style={{ width: `${pct * s.ratio}%`, background: s.couleur }}
                />
              ))
            ) : (
              <div
                className={`h-full rounded-full transition-all duration-700 ${done ? "bg-sun-500" : "bg-brand-500"}`}
                style={{ width: `${pct}%` }}
              />
            )}
          </div>
          <p className="mt-1.5 text-right text-xs font-semibold text-gray-500">{pct} %</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Objectifs actifs dans l'ordre de priorité, avec la provenance de l'argent :
 * chaque barre est découpée selon la part des cannettes, des dons et de l'argent personnel.
 */
export function GoalList({ goals, funds, compact = false }: { goals: GoalProgress[]; funds?: Funds; compact?: boolean }) {
  if (goals.length === 0) return null;
  const mix = funds ? fundsMix(funds) : null;
  const parts = mix && mix.total > 0 ? mix.parts : undefined;

  return (
    <div className={compact ? "space-y-4" : "space-y-3"}>
      {goals.map((g, i) => (
        <GoalProgressBar key={g.id} goal={g} compact={compact} rank={goals.length > 1 ? i + 1 : undefined} parts={parts} />
      ))}

      {funds && mix && mix.total > 0 && (
        <div className={compact ? "border-t border-gray-100 pt-4" : "card"}>
          <h3 className="mb-3 text-sm font-bold text-gray-900">D&apos;où vient l&apos;argent</h3>
          <FundsDonut funds={funds} />
        </div>
      )}
    </div>
  );
}
