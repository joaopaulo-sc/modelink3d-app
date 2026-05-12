"use client";
import { Plus, Trash2 } from "lucide-react";

export type MaterialRow = { material_id: string; estimated_weight: string };

export default function MaterialSelector({
  materials,
  value,
  onChange,
}: {
  materials: any[];
  value: MaterialRow[];
  onChange: (rows: MaterialRow[]) => void;
}) {
  const add = () => onChange([...value, { material_id: "", estimated_weight: "" }]);
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const upd = (i: number, k: keyof MaterialRow, v: string) =>
    onChange(value.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));

  return (
    <div className="space-y-2">
      {value.map((row, i) => (
        <div key={i} className="flex gap-2 items-center">
          <select
            className="input flex-1"
            value={row.material_id}
            onChange={e => upd(i, "material_id", e.target.value)}
          >
            <option value="">— Selecionar material —</option>
            {materials.map((m: any) => (
              <option key={m.id} value={m.id}>
                {m.brand} {m.material_type} {m.color} ({m.current_weight.toFixed(0)}g disp.)
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.1"
            className="input w-28"
            placeholder="Peso (g)"
            value={row.estimated_weight}
            onChange={e => upd(i, "estimated_weight", e.target.value)}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-red-400 hover:text-red-300 p-2 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="btn-ghost flex items-center gap-1 text-sm"
      >
        <Plus size={14} /> Adicionar Material
      </button>
      {value.length === 0 && (
        <p className="text-slate-500 text-xs">Nenhum material selecionado.</p>
      )}
    </div>
  );
}
