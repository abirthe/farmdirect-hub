import { useCurrency } from "@/contexts/CurrencyContext";
import React from "react";

export function CurrencyDisplay({ amount }: { amount: number | string }) {
  const { formatCurrency } = useCurrency();
  const num = typeof amount === "string" ? parseFloat(amount.replace(/[^\d.-]/g, "")) : amount;
  return <>{formatCurrency(num || 0)}</>;
}

export function CurrencySymbol() {
  const { currency } = useCurrency();
  const symbol = currency === "BDT" ? "৳" : currency === "EUR" ? "€" : "$";
  return <>{symbol}</>;
}
