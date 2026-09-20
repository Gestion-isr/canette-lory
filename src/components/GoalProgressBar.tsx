import { formatMoney } from "@/lib/format";
import type { GoalProgress } from "@/lib/types";

export function GoalProgressBar({ goal, compact = false }: { goal: GoalProgress; compact?: boolean }) {
  const pct = Math.min(100, Math.round((goal.raised_amount / goal.target_amount) * 100));
  const done = goal.raised_amount >= goal.target_amount;
  return (
    <div className={compact ? "" : "card"}>
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Objectif</p>
          <p className="text-lg font-bold text-gray-900">
            {done ? "🎉 " : "🎯 "}
            {goal.title}
          </p>
        </div>
        <p className="text-right text-sm text-gray-600">
          <span className="text-2xl font-extrabold text-brand-700">{formatMoney(goal.raised_amount)}</span>
          <br />
          sur {formatMoney(goal.target_amount)}
        </p>
      </div>
      <div
        className="mt-3 h-4 w-full overflow-hidden rounded-full bg-gray-100"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ${done ? "bg-sun-500" : "bg-brand-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1.5 text-right text-xs font-semibold text-gray-500">{pct} %</p>
    </div>
  );
}
