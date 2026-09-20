import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export function formatDateLong(iso: string): string {
  return format(parseISO(iso), "EEEE d MMMM yyyy", { locale: fr });
}

export function formatDateShort(iso: string): string {
  return format(parseISO(iso), "EEE d MMM", { locale: fr });
}

export function formatMoney(n: number): string {
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(n);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("fr-CA").format(n);
}
