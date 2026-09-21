import { formatMoney } from "@/lib/format";
import type { GoalProgress } from "@/lib/types";

export function GoalProgressBar({ goal, compact = false }: { goal: GoalProgress; compact?: boolean }) {
  const pct = Math.min(100, Math.round((goal.raised_amount / goal.target_amount) * 100));
  const done = goal.raised_amount >= goal.target_amount;
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
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Objectif</p>
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
          <div className="mt-1.5 flex items-center justify-between text-xs text-gray-500">
            <span>{goal.raised_donations > 0 ? `dont ${formatMoney(goal.raised_donations)} en dons 💛` : ""}</span>
            <span className="font-semibold">{pct} %</span>
          </div>
        </div>
      </div>
    </div>
  );
}
