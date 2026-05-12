"use client";
import { useState } from "react";
import { useCatalog } from "@/lib/hooks";
import { api } from "@/lib/api";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import toast from "react-hot-toast";
import ImageUpload from "@/components/ui/ImageUpload";

type CatalogItem = {
  id: number;
  name: string;
  description?: string;
  print_type: string;
  default_weight?: number;
  default_time?: number;
  file_url?: string;
  image_url?: string;
  notes?: string;
};

const blank = {
  name: "", description: "", print_type: "FDM",
  default_weight: "", default_time: "", file_url: "", image_url: "", notes: "",
};

export default function CatalogPage() {
  const { data: items = [], mutate } = useCatalog();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ ...blank });

  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const openNew = () => { setForm({ ...blank }); setEditing(null); setShowForm(true); };

  const openEdit = (item: CatalogItem) => {
    setForm({
      name: item.name,
      description: item.description ?? "",
      print_type: item.print_type,
      default_weight: item.default_weight != null ? String(item.default_weight) : "",
      default_time: item.default_time != null ? String(item.default_time) : "",
      file_url: item.file_url ?? "",
      image_url: item.image_url ?? "",
      notes: item.notes ?? "",
    });
    setEditing(item.id);
    setShowForm(true);
  };

  const buildPayload = () => ({
    name: form.name,
    description: form.description || null,
    print_type: form.print_type,
    default_weight: form.default_weight ? Number(form.default_weight) : null,
    default_time: form.default_time ? Number(form.default_time) : null,
    file_url: form.file_url || null,
    image_url: form.image_url || null,
    notes: form.notes || null,
  });

  const save = async () => {
    if (!form.name) { toast.error("Nome obrigatório"); return; }
    try {
      if (editing) {
        await api.put(`/catalog/${editing}`, buildPayload());
        toast.success("Item atualizado!");
      } else {
        await api.post("/catalog", buildPayload());
        toast.success("Item cadastrado!");
      }
      setShowForm(false);
      setEditing(null);
      mutate();
    } catch { toast.error("Erro ao salvar"); }
  };

  const del = async (id: number, name: string) => {
    if (!confirm(`Excluir "${name}"?`)) return;
    try {
      await api.delete(`/catalog/${id}`);
      toast.success("Item excluído");
      mutate();
    } catch { toast.error("Erro ao excluir"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Catálogo de Itens</h1>
          <p className="text-slate-400 text-sm mt-0.5">Itens pré-configurados para uso rápido nos orçamentos</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Novo Item
        </button>
      </div>

      {showForm && (
        <div className="card space-y-4">
          <h2 className="font-semibold">{editing ? "Editar Item" : "Novo Item"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="label">Nome do Item *</label>
              <input className="input" value={form.name} onChange={e => upd("name", e.target.value)}
                placeholder="Ex: Miniatura RPG 32mm, Suporte iPhone 14..." />
            </div>

            <div>
              <label className="label">Tipo de Impressão</label>
              <select className="input" value={form.print_type} onChange={e => upd("print_type", e.target.value)}>
                <option value="FDM">FDM</option>
                <option value="Resin">Resina</option>
              </select>
            </div>

            <div>
              <label className="label">Peso Padrão (g)</label>
              <input type="number" step="0.1" className="input" value={form.default_weight}
                onChange={e => upd("default_weight", e.target.value)} placeholder="Ex: 45" />
            </div>

            <div>
              <label className="label">Tempo de Impressão Padrão (horas)</label>
              <input type="number" step="0.1" className="input" value={form.default_time}
                onChange={e => upd("default_time", e.target.value)} placeholder="Ex: 2.5" />
            </div>

            <div>
              <label className="label">Link do Arquivo 3D</label>
              <input className="input" value={form.file_url}
                onChange={e => upd("file_url", e.target.value)} placeholder="https://..." />
            </div>

            <div>
              <label className="label">Imagem de Referência</label>
              <ImageUpload value={form.image_url} onChange={(url) => upd("image_url", url)} />
            </div>

            <div className="md:col-span-2">
              <label className="label">Descrição</label>
              <textarea className="input" rows={2} value={form.description}
                onChange={e => upd("description", e.target.value)}
                placeholder="Detalhes, variações, instruções de impressão..." />
            </div>

            <div className="md:col-span-2">
              <label className="label">Notas Internas</label>
              <textarea className="input" rows={2} value={form.notes}
                onChange={e => upd("notes", e.target.value)}
                placeholder="Configurações do fatiador, perfil recomendado..." />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="btn-ghost">Cancelar</button>
            <button onClick={save} className="btn-primary">{editing ? "Salvar Alterações" : "Cadastrar Item"}</button>
          </div>
        </div>
      )}

      {items.length === 0 && !showForm ? (
        <div className="text-center py-16 space-y-3">
          <Package size={40} className="mx-auto text-slate-600" />
          <p className="text-slate-400">Nenhum item cadastrado ainda.</p>
          <p className="text-slate-500 text-sm">Cadastre itens para agilizar a criação de orçamentos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item: CatalogItem) => (
            <div key={item.id} className="card space-y-3">
              {item.image_url && (
                <img src={item.image_url} alt={item.name} className="w-full h-36 object-cover rounded-lg" />
              )}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold leading-tight">{item.name}</p>
                  {item.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</p>
                  )}
                </div>
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                  item.print_type === "FDM" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"
                }`}>
                  {item.print_type}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-700 rounded-lg p-2">
                  <p className="text-slate-400">Peso</p>
                  <p className="font-medium">{item.default_weight != null ? `${item.default_weight}g` : "—"}</p>
                </div>
                <div className="bg-slate-700 rounded-lg p-2">
                  <p className="text-slate-400">Tempo</p>
                  <p className="font-medium">{item.default_time != null ? `${item.default_time}h` : "—"}</p>
                </div>
              </div>

              {item.notes && (
                <p className="text-xs text-slate-500 italic line-clamp-1">{item.notes}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button onClick={() => openEdit(item)} className="btn-ghost flex-1 flex items-center justify-center gap-1 text-sm">
                  <Pencil size={14} /> Editar
                </button>
                <button onClick={() => del(item.id, item.name)} className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
