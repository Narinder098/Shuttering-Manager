import { rentals } from "../../../lib/mock";
import { calcItemTotal } from "../../../lib/calc";
// import { rentals } from "@/lib/mock";
// import { calcItemTotal } from "@/lib/calc";

export default function AdminDashboard() {
  const pendingPayments = rentals.filter(r => r.paymentStatus === "PENDING" || r.paymentStatus === "OVERDUE");
  const ongoing = rentals.filter(r => r.materialStatus !== "COMPLETED");

  const totalDue = pendingPayments.reduce((sum, r) => {
    const itemsTotal = r.items.reduce((s, it) => s + calcItemTotal(it.dateOut, it.ratePerDay, it.qtyOut, it.partialReturns), 0);
    const paid = r.payments.reduce((p, pay) => p + pay.amount, 0);
    return sum + Math.max(0, itemsTotal - paid);
  }, 0);

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Admin Dashboard</h2>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Ongoing Rentals</div>
          <div className="text-2xl font-bold">{ongoing.length}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Pending/Overdue Payments</div>
          <div className="text-2xl font-bold">{pendingPayments.length}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Total Due (₹)</div>
          <div className="text-2xl font-bold">{totalDue}</div>
        </div>
      </div>

      <section className="space-y-3">
        <h3 className="font-semibold">Pending Payments</h3>
        {pendingPayments.map(r => (
          <div key={r.id} className="border rounded p-3">
            <div className="font-medium">{r.customerName} — {r.paymentStatus}</div>
            <div className="text-sm text-gray-600">Items: {r.items.map(i => `${i.name}(${i.qtyOut})`).join(", ")}</div>
          </div>
        ))}
      </section>
    </main>
  );
}
