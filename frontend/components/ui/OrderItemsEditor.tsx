"use client";
import { Plus, Trash2 } from "lucide-react";

export type OrderItemRow = {
  item_name: string;
  quantity: string;
  unit_price: string;
};

const blank = (): OrderItemRow => ({ item_name: "", quantity: "1", unit_price: "" });

interface Props {
  value: OrderItemRow[];
  onChange: (rows: OrderItemRow[]) => void;
}

export default function OrderItemsEditor({ value, onChange }: Props) {
  const upd = (i: number, field: keyof OrderItemRow, v: string) => {
    const next = value.map((row, idx) => (idx === i ? { ...row, [field]: v } : row));
    onChange(next);
  };

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  const add = () => onChange([...value, blank()]);

  const total = value.reduce((sum, row) => {
    const qty = Number(row.quantity) || 1;
    const price = Number(row.unit_price) || 0;
    return sum + qty * price;
  }, 0);

  return (
    <div className="space-y-2">
      {value.map((row, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            className="input flex-1"
            placeholder="Nome do item *"
            value={row.item_name}
            onChange={e => upd(i, "item_name", e.target.value)}
          />
          <input
            type="number"
            min="1"
            className="input w-20 text-center"
            placeholder="Qtd"
            value={row.quantity}
            onChange={e => upd(i, "quantity", e.target.value)}
          />
          <div className="relative w-28">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input pl-8 w-full"
              placeholder="0,00"
              value={row.unit_price}
              onChange={e => upd(i, "unit_price", e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors shrink-0"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="btn-ghost flex items-center gap-1.5 text-sm w-full justify-center border border-dashed border-slate-600 py-2"
      >
        <Plus size={14} /> Adicionar item
      </button>

      {value.length > 0 && total > 0 && (
        <div className="flex justify-end text-sm text-slate-300">
          <span className="text-slate-400 mr-2">Total dos itens:</span>
          <span className="font-semibold">R$ {total.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}
