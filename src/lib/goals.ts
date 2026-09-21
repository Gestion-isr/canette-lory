import type { Goal, GoalProgress } from "@/lib/types";

/**
 * Répartit la cagnotte disponible sur les objectifs actifs, dans l'ordre de priorité :
 * le premier est rempli en entier avant que l'argent ne passe au suivant.
 */
export function allocateFunds(goals: Goal[], available: number): { goals: GoalProgress[]; surplus: number } {
  let rest = Math.max(0, available);
  const sorted = [...goals].sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at));
  const out = sorted.map((g) => {
    const raised = Math.min(g.target_amount, rest);
    rest -= raised;
    return { ...g, raised_amount: raised };
  });
  return { goals: out, surplus: rest };
}
