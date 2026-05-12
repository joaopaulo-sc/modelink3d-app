"use client";
import { useState } from "react";
import { usePrinters } from "@/lib/hooks";
import { api } from "@/lib/api";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

const STATUS_LABELS: Record<string, string> = { Idle: "Disponível", Printing: "Imprimindo", Maintenance: "Manutenção" };
const STATUS_COLORS: Record<string, string> = {
  Idle: "bg-green-500/20 text-green-400",
  Printing: "bg-blue-500/20 text-blue-400",
  Maintenance: "bg-red-500/20 text-red-400",
};

type EditForm = { name: string; type: string };

export default function PrintersPage() {
  const { data: printers = [], mutate } = usePrinters();
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", type: "FDM" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ name: "", type: "FDM" });

  // ── Criar ──────────────────────────────────────────────────
  const save = async () => {
    if (!newForm.name.trim()) { toast.error("Nome obrigatório"); return; }
    try {
      await api.post("/printers", newForm);
      toast.success("Impressora cadastrada!");
      setNewForm({ name: "", type: "FDM" });
      setShowNew(false);
      mutate();
    } catch { toast.error("Erro ao salvar"); }
  };

  // ── Editar ─────────────────────────────────────────────────
  const openEdit = (p: any) => {
    setEditingId(p.id);
    setEditForm({ name: p.name, type: p.type });
  };

  const saveEdit = async (id: number) => {
    if (!editForm.name.trim()) { toast.error("Nome obrigatório"); return; }
    try {
      await api.patch(`/printers/${id}`, editForm);
      toast.success("Impressora atualizada!");
      setEditingId(null);
      mutate();
    } catch { toast.error("Erro ao salvar"); }
  };

  // ── Status ─────────────────────────────────────────────────
  const setStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/printers/${id}`, { status });
      mutate();
    } catch { toast.error("Erro ao alterar status"); }
  };

  // ── Excluir ────────────────────────────────────────────────
  const del = async (id: number, name: string) => {
    if (!confirm(`Excluir a impressora "${name}"?\nPedidos vinculados a ela não serão apagados.`)) return;
    try {
      await api.delete(`/printers/${id}`);
      toast.success("Impressora excluída");
      mutate();
    } catch { toast.error("Erro ao excluir"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Impressoras</h1>
        <button onClick={() => { setShowNew(!showNew); setEditingId(null); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nova Impressora
        </button>
      </div>

      {/* Formulário de criação */}
      {showNew && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Nova Impressora</h2>
            <button onClick={() => setShowNew(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Nome *</label>
              <input
                className="input"
                value={newForm.name}
                onChange={e => setNewForm({ ...newForm, name: e.target.value })}
                placeholder="Ex: FDM 1 - Ender 3 V2"
                onKeyDown={e => e.key === "Enter" && save()}
              />
            </div>
            <div>
              <label className="label">Tipo</label>
              <select className="input" value={newForm.type} onChange={e => setNewForm({ ...newForm, type: e.target.value })}>
                <option value="FDM">FDM</option>
                <option value="Resin">Resina</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowNew(false)} className="btn-ghost">Cancelar</button>
            <button onClick={save} className="btn-primary">Cadastrar</button>
          </div>
        </div>
      )}

      {/* Cards das impressoras */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {printers.map((p: any) => (
          <div key={p.id} className="card space-y-3">

            {editingId === p.id ? (
              /* Modo edição inline */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-slate-300">Editar Impressora</h3>
                  <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-white"><X size={14} /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Nome *</label>
                    <input
                      className="input"
                      value={editForm.name}
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      onKeyDown={e => e.key === "Enter" && saveEdit(p.id)}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="label">Tipo</label>
                    <select className="input" value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })}>
                      <option value="FDM">FDM</option>
                      <option value="Resin">Resina</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditingId(null)} className="btn-ghost text-sm">Cancelar</button>
                  <button onClick={() => saveEdit(p.id)} className="btn-primary text-sm">Salvar</button>
                </div>
              </div>
            ) : (
              /* Modo visualização */
              <>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{p.name}</p>
                    <span className="text-xs text-slate-400">{p.type === "FDM" ? "FDM" : "Resina"}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[p.status]}`}>
                      {STATUS_LABELS[p.status]}
                    </span>
                    <button onClick={() => openEdit(p)} className="btn-ghost p-1.5" title="Editar">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => del(p.id, p.name)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors" title="Excluir">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Controles de status */}
                <div className="flex gap-1.5 flex-wrap">
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setStatus(p.id, key)}
                      disabled={p.status === key}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                        p.status === key
                          ? `${STATUS_COLORS[key]} font-medium cursor-default`
                          : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}

        {printers.length === 0 && (
          <p className="text-slate-400 text-center py-12 col-span-2">
            Nenhuma impressora cadastrada.
          </p>
        )}
      </div>
    </div>
  );
}
