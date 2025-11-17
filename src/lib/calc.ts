// Simple date helpers without dependencies
// Return ISO string YYYY-MM-DD for today
export function todayISO() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

// Return total days between two dates (inclusive of first day)
export function daysBetween(start: string, end: string) {
  try {
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
    return diff <= 0 ? 1 : diff; // minimum 1 day
  } catch (err) {
    return 1;
  }
}

// Price for one rental item with partial returns (unreturned billed until today)
export const calcItemTotal = (dateOut: string, rate: number, qtyOut: number, partialReturns: {qty:number; dateIn:string;}[]) => {
  let total = 0;
  let returned = 0;
  for (const pr of partialReturns) {
    total += pr.qty * daysBetween(dateOut, pr.dateIn) * rate;
    returned += pr.qty;
  }
  const remaining = qtyOut - returned;
  if (remaining > 0) {
    total += remaining * daysBetween(dateOut, todayISO()) * rate;
  }
  return total;
};

// Sum totals for a rental
export const calcRentalTotal = (items: {dateOut:string; ratePerDay:number; qtyOut:number; partialReturns:{qty:number;dateIn:string;}[]}[]) =>
  items.reduce((sum, it) => sum + calcItemTotal(it.dateOut, it.ratePerDay, it.qtyOut, it.partialReturns), 0);

