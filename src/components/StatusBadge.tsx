import type { PickupStatus } from "@/lib/types";

const STYLES: Record<PickupStatus, string> = {
  en_attente: "bg-sun-400/25 text-amber-800",
  completee: "bg-brand-100 text-brand-800",
  annulee: "bg-gray-100 text-gray-500",
};

export function StatusBadge({ status, label }: { status: PickupStatus; label: string }) {
  return <span className={`badge ${STYLES[status]}`}>{label}</span>;
}
