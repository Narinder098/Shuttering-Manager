export type Material = {
  id: string;
  name: string;              // e.g., "Prop", "Plate", "Jack"
  unit: string;              // "piece", "sheet"
  dailyRate: number;         // INR per day per unit
  stock: number;             // current in-stock count
  minStock?: number;         // threshold for low-stock alert
  imageUrl?: string;
  active: boolean;
  image?: string;
  nameHi?: string;
};

export type PartialReturn = {
  qty: number;
  dateIn: string;            // ISO date
};

export type RentalItem = {
  materialId: string;
  name: string;
  qtyOut: number;
  dateOut: string;           // ISO date
  ratePerDay: number;
  partialReturns: PartialReturn[];
};

export type PaymentStatus = "NOT_STARTED" | "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";
export type MaterialStatus = "ONGOING" | "PARTIAL_RETURN" | "COMPLETED";

export type PaymentRecord = {
  amount: number;
  date: string;              // ISO
  method?: "CASH" | "UPI" | "BANK";
  note?: string;
};

export type Rental = {
  id: string;
  customerId: string;
  customerName: string;
  phone?: string;
  items: RentalItem[];
  materialStatus: MaterialStatus;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: string;         // ISO
  closedAt?: string;         // when all returned
  payments: PaymentRecord[];
};

export type Customer = {
  id: string;
  name: string;
  phone?: string;
  category?: "NEW" | "REGULAR" | "LATE_PAYER";
};
