import { Material, Rental, Customer } from "./types";

export const materials: Material[] = [
  { id: "m1", name: "Prop", nameHi: "प्रॉप", unit: "piece", dailyRate: 12, stock: 120, minStock: 40, active: true, image: "/materials/prop.jpg", },
  { id: "m2", name: "Plate", nameHi: "प्लेट", unit: "piece", dailyRate: 15, stock: 300, minStock: 100, active: true, image: "/materials/plate.jpg", },
  { id: "m3", name: "Jack", nameHi: "जैक", unit: "piece", dailyRate: 20, stock: 50, minStock: 20, active: true, image: "/materials/jack.jpg", },
  { id: "m4", name: "Span", nameHi: "स्पैन", unit: "piece", dailyRate: 25, stock: 80, minStock: 30, active: true, image: "/materials/span.jpg", },
  { id: "m5", name: "Beam", nameHi: "बीम", unit: "piece", dailyRate: 30, stock: 60, minStock: 25, active: true, image: "/materials/beam.jpg", },
  { id: "m6", name: "Column", nameHi: "कॉलम", unit: "piece", dailyRate: 35, stock: 40, minStock: 15, active: true, image: "/materials/column.jpg", },
  { id: "m7", name: "Plywood", nameHi: "प्लाईवुड", unit: "sheet", dailyRate: 50, stock: 150, minStock: 50, active: true, image: "/materials/plywood.jpg", },

];

export const customers: Customer[] = [
  { id: "c1", name: "Raju", phone: "9xxxxxxxxx", category: "REGULAR" },
  { id: "c2", name: "Pawan", phone: "9xxxxxxxxx", category: "NEW" },
];

export const rentals: Rental[] = [
  {
    id: "r1",
    customerId: "c1",
    customerName: "Raju",
    phone: "9xxxxxxxxx",
    items: [
      {
        materialId: "m1", name: "Prop", qtyOut: 20, dateOut: "2025-11-10", ratePerDay: 12,
        partialReturns: [{ qty: 10, dateIn: "2025-11-15" }] // remaining 10 not returned yet
      },
      {
        materialId: "m2", name: "Plate", qtyOut: 30, dateOut: "2025-11-08", ratePerDay: 15,
        partialReturns: [{ qty: 30, dateIn: "2025-11-16" }]
      }
    ],
    materialStatus: "PARTIAL_RETURN",
    paymentStatus: "PENDING",
    createdAt: "2025-11-10",
    payments: [{ amount: 500, date: "2025-11-16", method: "CASH" }]
  }
];
