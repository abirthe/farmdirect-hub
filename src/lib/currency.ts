export const CURRENCY = {
  symbol: "৳",
  code: "BDT",
  locale: "en-BD",
  
  // A helper function you can use in the future to format raw numbers globally
  format: (amount: number) => {
    return new Intl.NumberFormat(CURRENCY.locale, {
      style: 'currency',
      currency: CURRENCY.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace(CURRENCY.code, CURRENCY.symbol).trim();
  }
};
