import React, { createContext, useContext, useState, useEffect } from "react";

type Currency = "BDT" | "USD" | "EUR";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (baseBdtAmount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Exchange rates relative to BDT (Base)
const RATES = {
  BDT: 1,
  USD: 0.0083, // Example: 1 BDT = 0.0083 USD (roughly 120 Tk = 1 Dollar) 
  EUR: 0.0076,
};

const SYMBOLS = {
  BDT: "\u09F3",
  USD: "$",
  EUR: "\u20AC",
};

export const CurrencyProvider = ({ children }: { children: React.ReactNode }) => {
  // Try to load from localStorage or default to BDT
  const [currency, setCurrencyState] = useState<Currency>("BDT");

  useEffect(() => {
    const saved = localStorage.getItem("preferred_currency") as Currency;
    if (saved && ["BDT", "USD", "EUR"].includes(saved)) {
      setCurrencyState(saved);
    }
  }, []);

  const setCurrency = (curr: Currency) => {
    setCurrencyState(curr);
    localStorage.setItem("preferred_currency", curr);
  };

  const formatCurrency = (baseBdtAmount: number) => {
    const rate = RATES[currency];
    const converted = baseBdtAmount * rate;
    
    // Auto-formatting configuration
    const fractionDigits = currency === "BDT" ? 0 : 2; 
    
    return new Intl.NumberFormat(currency === "BDT" ? "en-BD" : "en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })
      .format(converted)
      .replace(currency, SYMBOLS[currency]) // Failsafe for BDT native symbol rendering
      .trim();
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
