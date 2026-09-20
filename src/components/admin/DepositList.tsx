"use client";

import { useTransition } from "react";
import { deleteDeposit } from "@/actions/admin";
import { formatDateShort, formatMoney } from "@/lib/format";
import type { Deposit } from "@/lib/types";

export function DepositList({ deposits }: { deposits: Deposit[] }) {
  const [pending, start] = useTransition();
  if (deposits.length === 0) return <p className="text-sm text-gray-500">Aucun dépôt pour l&apos;instant.</p>;
  return (
    <ul className="divide-y divide-gray-100">
      {deposits.map((d) => (
        <li key={d.id} className="flex items-center justify-between gap-3 py-2 text-sm">
          <div>
            <span className={`font-semibold ${d.kind === "don" ? "text-amber-600" : "text-brand-700"}`}>{formatMoney(Number(d.amount))}</span>
            {d.kind === "don" ? (
              <span className="badge ml-2 bg-sun-400/25 text-amber-800">💛 don</span>
            ) : (
              d.cans_count != null && <span className="text-gray-500"> · {d.cans_count} cannettes</span>
            )}
            <span className="block text-xs capitalize text-gray-400">
              {formatDateShort(d.deposited_at)}
              {d.note ? ` · ${d.note}` : ""}
            </span>
          </div>
          <button
            disabled={pending}
            onClick={() => {
              if (confirm("Supprimer ce dépôt ?")) start(async () => { await deleteDeposit(d.id); });
            }}
            className="text-xs text-gray-400 hover:text-red-600"
          >
            Supprimer
          </button>
        </li>
      ))}
    </ul>
  );
}
