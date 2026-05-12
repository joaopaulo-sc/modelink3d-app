"use client";
import { useState } from "react";
import { useMaterials } from "@/lib/hooks";
import { api } from "@/lib/api";
import { Plus, AlertTriangle, Pencil, X } from "lucide-react";
import toast from "react-hot-toast";

const blank = { brand: "", material_type: "PLA", color: "", initial_weight: "", min_alert_weight: "150", price_per_gram: "" };
type MatForm = typeof blank;

const TYPES = ["PLA", "PETG", "ABS", "ASA", "TPU", "ABS-Like Resina", "Standard Resina"];

function MaterialFormFields({ form, upd }: { form: MatForm; upd: (k: string, v: string) => void }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <div><label className="label">Marca *</label><input className="input" value={form.brand} onChange={e => upd("brand", e.target.value)} placeholder="Bambu, Polymaker..." /></div>
      <div>
        <label className="label">Tipo *</label>
        <select className="input" value={form.material_type} onChange={e => upd("material_type", e.target.value)}>
          {TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div><label className="label">Cor *</label><input className="input" value={form.color} onChange={e => upd("color", e.target.value)} placeholder="Vermelho, Transparente..." /></div>
      <div><label className="label">Peso Inicial (g) *</label><input type="number" className="input" value={form.initial_weight} onChange={e => upd("initial_weight", e.target.value)} placeholder="1000" /></div>
      <div><label className="label">Alerta Mín. (g)</label><input type="number" className="input" value={form.min_alert_weight} onChange={e => upd("min_alert_weight", e.target.value)} /></div>
      <div><label className="label">Preço/grama (R$)</label><input type="number" step="0.001" className="input" value={form.price_per_gram} onChange={e => upd("price_per_gram", e.target.value)} placeholder="0.08" /></div>
    </div>
  );
}

function matToForm(m: any): MatForm {
  return {
    brand: m.brand,
    material_type: m.material_type,
    color: m.color,
    initial_weight: String(m.initial_weight),
    min_alert_weight: String(m.min_alert_weight),
    price_per_gram: m.price_per_gram ? String(m.price_per_gram) : "",
  };
}

export default function MaterialsPage() {
  const { data: materials = [], mutate } = useMaterials();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<MatForm>({ ...blank });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<MatForm>({ ...blank });

  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const updEdit = (k: string, v: string) => setEditForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.brand || !form.color || !form.initial_weight) { toast.error("Preencha os campos obrigatórios"); return; }
    try {
      await api.post("/materials", {
        brand: form.brand, material_type: form.material_type, color: form.color,
        initial_weight: Number(form.initial_weight),
        min_alert_weight: Number(form.min_alert_weight) || 150,
        price_per_gram: Number(form.price_per_gram) || 0,
      });
      toast.success("Material cadastrado!");
      setForm({ ...blank });
      setShowForm(false);
      mutate();
    } catch { toast.error("Erro ao salvar"); }
  };

  const saveEdit = async (id: number) => {
    if (!editForm.brand || !editForm.color) { toast.error("Preencha os campos obrigatórios"); return; }
    try {
      await api.patch(`/materials/${id}`, {
        brand: editForm.brand,
        material_type: editForm.material_type,
        color: editForm.color,
        initial_weight: editForm.initial_weight ? Number(editForm.initial_weight) : undefined,
        min_alert_weight: Number(editForm.min_alert_weight) || 150,
        price_per_gram: Number(editForm.price_per_gram) || 0,
      });
      toast.success("Material atualizado!");
      setEditingId(null);
      mutate();
    } catch { toast.error("Erro ao salvar"); }
  };

  const openEdit = (m: any) => {
    setEditingId(m.id);
    setEditForm(matToForm(m));
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Materiais</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Novo Material
        </button>
      </div>

      {showForm && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Novo Material</h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
          </div>
          <MaterialFormFields form={form} upd={upd} />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="btn-ghost">Cancelar</button>
            <button onClick={save} className="btn-primary">Salvar</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {materials.map((m: any) => {
          const pct = Math.min(100, (m.current_weight / m.initial_weight) * 100);

          if (editingId === m.id) {
            return (
              <div key={m.id} className="card space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Editando: {m.brand} {m.material_type} {m.color}</h3>
                  <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-white"><X size={16} /></button>
                </div>
                <MaterialFormFields form={editForm} upd={updEdit} />
                <div>
                  <label className="label">Peso Atual (g)</label>
                  <input
                    type="number"
                    className="input w-40"
                    value={editForm.initial_weight}
                    onChange={e => updEdit("initial_weight", e.target.value)}
                    placeholder="Peso atual real"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditingId(null)} className="btn-ghost">Cancelar</button>
                  <button onClick={() => saveEdit(m.id)} className="btn-primary">Salvar Alterações</button>
                </div>
              </div>
            );
          }

          return (
            <div key={m.id} className={`card ${m.low_stock ? "border-yellow-500/50" : ""}`}>
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{m.brand} {m.material_type}</span>
                    <span className="text-xs bg-slate-700 px-2 py-0.5 rounded">{m.color}</span>
                    {m.low_stock && <AlertTriangle size={14} className="text-yellow-400" />}
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-slate-400">
                    <span>{m.current_weight.toFixed(0)}g / {m.initial_weight.toFixed(0)}g</span>
                    {m.price_per_gram > 0 && <span>R$ {m.price_per_gram.toFixed(3)}/g</span>}
                    <span>Alerta: &lt;{m.min_alert_weight}g</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-slate-600 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pct > 30 ? "bg-blue-500" : pct > 10 ? "bg-yellow-500" : "bg-red-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <button onClick={() => openEdit(m)} className="btn-ghost p-1.5" title="Editar">
                  <Pencil size={14} />
                </button>
              </div>
            </div>
          );
        })}
        {materials.length === 0 && <p className="text-slate-400 text-center py-12">Nenhum material cadastrado.</p>}
      </div>
    </div>
  );
}
