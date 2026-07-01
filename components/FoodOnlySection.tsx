"use client";

import { useState } from "react";

interface FoodOrder {
  id: number;
  customer_name: string;
  items: string;
  amount: number;
  created_at: string;
}

function AddFoodOrderModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [name, setName] = useState("");
  const [items, setItems] = useState("");
  const [amount, setAmount] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd() {
    setError("");
    if (!name.trim()) { setError("Customer name required"); return; }
    setLoading(true);
    const res = await fetch("/api/food-only", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_name: name, items, amount: Number(amount) }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error || "Failed"); setLoading(false); return; }
    onAdded();
    onClose();
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="table-felt rounded-xl p-5 w-full max-w-sm shadow-2xl space-y-4">
        <h3 className="font-display text-lg font-bold">New Food Order</h3>
        <div>
          <label className="block text-xs text-[var(--cream-300)] mb-1">Customer Name</label>
          <input className="w-full" value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="block text-xs text-[var(--cream-300)] mb-1">Items (optional)</label>
          <input className="w-full" placeholder="e.g. Burger, Cold drink" value={items} onChange={e => setItems(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-[var(--cream-300)] mb-1">Amount (₹)</label>
          <input type="number" min="0" className="w-full" value={amount} onChange={e => setAmount(e.target.value)} />
        </div>
        {error && <p className="text-sm text-[#e69aa6]">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-md border border-[var(--brass-500)]/40 text-[var(--cream-300)] hover:bg-white/5">Cancel</button>
          <button onClick={handleAdd} disabled={loading} className="px-4 py-2 rounded-md bg-[var(--brass-500)] text-[var(--ink)] font-semibold hover:bg-[var(--brass-400)] disabled:opacity-60">
            {loading ? "Adding…" : "Add Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditFoodModal({ order, onClose, onSaved }: { order: FoodOrder; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(order.customer_name);
  const [items, setItems] = useState(order.items || "");
  const [amount, setAmount] = useState(String(order.amount));
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    await fetch(`/api/food-only/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_name: name, items, amount: Number(amount) }),
    });
    onSaved();
    onClose();
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="table-felt rounded-xl p-5 w-full max-w-sm shadow-2xl space-y-4">
        <h3 className="font-display text-lg font-bold">Edit Food Order #{order.id}</h3>
        <div>
          <label className="block text-xs text-[var(--cream-300)] mb-1">Customer Name</label>
          <input className="w-full" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-[var(--cream-300)] mb-1">Items</label>
          <input className="w-full" value={items} onChange={e => setItems(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-[var(--cream-300)] mb-1">Amount (₹)</label>
          <input type="number" min="0" className="w-full" value={amount} onChange={e => setAmount(e.target.value)} />
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-md border border-[var(--brass-500)]/40 text-[var(--cream-300)] hover:bg-white/5">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="px-4 py-2 rounded-md bg-[var(--brass-500)] text-[var(--ink)] font-semibold disabled:opacity-60">
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FoodOnlySection({ orders, onRefresh }: { orders: FoodOrder[]; onRefresh: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editOrder, setEditOrder] = useState<FoodOrder | null>(null);

  async function handleDelete(id: number) {
    if (!confirm("Delete this food order?")) return;
    await fetch(`/api/food-only/${id}`, { method: "DELETE" });
    onRefresh();
  }

  const total = orders.reduce((sum, o) => sum + Number(o.amount), 0);

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-[var(--cream-300)]">
          {orders.length === 0 ? "No food orders today" : `${orders.length} order${orders.length > 1 ? "s" : ""} · ₹${total.toFixed(0)} total`}
        </p>
        <button
          onClick={() => setShowAdd(true)}
          className="text-xs px-3 py-1.5 rounded-md bg-[var(--brass-500)] text-[var(--ink)] font-semibold hover:bg-[var(--brass-400)]"
        >
          + New Order
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-10 text-[var(--cream-300)]/40 text-sm">
          No food-only orders yet today
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map(o => (
            <div key={o.id} className="rounded-xl border border-[var(--brass-500)]/15 bg-[var(--felt-800)]/30 p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--cream-100)] truncate">{o.customer_name}</span>
                  <span className="font-mono-score text-xs text-[var(--brass-400)]">₹{Number(o.amount).toFixed(0)}</span>
                </div>
                {o.items && <p className="text-xs text-[var(--cream-300)]/60 truncate mt-0.5">{o.items}</p>}
                <p className="text-[10px] text-[var(--cream-300)]/40 mt-0.5">
                  {new Date(o.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={() => setEditOrder(o)} className="text-[10px] px-2 py-1 rounded border border-[var(--brass-500)]/30 text-[var(--cream-300)] hover:bg-white/5">✏</button>
                <button onClick={() => handleDelete(o.id)} className="text-[10px] px-2 py-1 rounded border border-[var(--red-felt)]/40 text-[#e69aa6] hover:bg-[var(--red-felt)]/10">🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddFoodOrderModal onClose={() => setShowAdd(false)} onAdded={() => { onRefresh(); setShowAdd(false); }} />}
      {editOrder && <EditFoodModal order={editOrder} onClose={() => setEditOrder(null)} onSaved={() => { onRefresh(); setEditOrder(null); }} />}
    </>
  );
}
