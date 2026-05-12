"use client";
import { useState } from "react";
import { useStock, useMaterials, useCatalog } from "@/lib/hooks";
import { api } from "@/lib/api";
import { Plus, ExternalLink, Pencil, Trash2, X, BookOpen, Search } from "lucide-react";
import toast from "react-hot-toast";
import MultiImageUpload from "@/components/ui/MultiImageUpload";

const blank = {
  name: "",
  quantity: "1",
  sell_price: "",
  production_cost: "",
  material_id: "",
  description: "",
  image_urls: [] as string[],
};

type ItemForm = typeof blank;

function formToPayload(form: ItemForm) {
  return {
    name: form.name,
    quantity: Number(form.quantity) || 0,
    sell_price: Number(form.sell_price) || 0,
    production_cost: form.production_cost ? Number(form.production_cost) : null,
    material_id: form.material_id ? Number(form.material_id) : null,
    description: form.description || null,
    image_url: form.image_urls[0] ?? null,
    image_urls: form.image_urls.length ? form.image_urls : null,
  };
}

function itemToForm(item: any): ItemForm {
  const image_urls: string[] =
    item.image_urls?.length ? item.image_urls
    : item.image_url ? [item.image_url]
    : [];
  return {
    name: item.name,
    quantity: String(item.quantity),
    sell_price: String(item.sell_price),
    production_cost: item.production_cost != null ? String(item.production_cost) : "",
    material_id: item.material_id != null ? String(item.material_id) : "",
    description: item.description ?? "",
    image_urls,
  };
}

function CatalogPicker({ onSelect }: { onSelect: (item: any) => void }) {
  const { data: catalogItems = [] } = useCatalog();
  const [search, setSearch] = useState("");

  const filtered = catalogItems.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="border border-blue-500/40 rounded-xl bg-slate-800/60 p-3 space-y-2">
      <p className="text-sm font-medium text-blue-400">Selecione um item do catálogo para pré-preencher o formulário:</p>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-8 text-sm"
          placeholder="Buscar no catálogo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />
      </div>
      <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
        {filtered.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-4">Nenhum item encontrado.</p>
        )}
        {filtered.map((c: any) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c)}
            className="w-full flex items-center gap-3 text-left p-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            {c.image_url ? (
              <img src={c.image_url} alt={c.name} className="w-10 h-10 object-cover rounded-lg shrink-0" />
            ) : (
              <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center text-slate-500 shrink-0 text-lg">📦</div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{c.name}</p>
              {c.description && <p className="text-xs text-slate-400 truncate">{c.description}</p>}
            </div>
            <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${c.print_type === "FDM" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"}`}>
              {c.print_type}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ItemFormFields({
  form,
  setForm,
  materials,
}: {
  form: ItemForm;
  setForm: (f: ItemForm) => void;
  materials: any[];
}) {
  const upd = (k: keyof ItemForm, v: any) => setForm({ ...form, [k]: v });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="col-span-2 md:col-span-1">
          <label className="label">Nome *</label>
          <input className="input" value={form.name} onChange={e => upd("name", e.target.value)} />
        </div>
        <div>
          <label className="label">Quantidade</label>
          <input type="number" className="input" value={form.quantity} onChange={e => upd("quantity", e.target.value)} />
        </div>
        <div>
          <label className="label">Preço Venda (R$)</label>
          <input type="number" step="0.01" className="input" value={form.sell_price} onChange={e => upd("sell_price", e.target.value)} />
        </div>
        <div>
          <label className="label">Custo Produção (R$)</label>
          <input type="number" step="0.01" className="input" value={form.production_cost} onChange={e => upd("production_cost", e.target.value)} />
        </div>
        <div>
          <label className="label">Material</label>
          <select className="input" value={form.material_id} onChange={e => upd("material_id", e.target.value)}>
            <option value="">—</option>
            {materials.map((m: any) => (
              <option key={m.id} value={m.id}>{m.brand} {m.material_type} {m.color}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2 md:col-span-3">
          <label className="label">Descrição</label>
          <textarea className="input" rows={2} value={form.description} onChange={e => upd("description", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Fotos do Produto</label>
        <MultiImageUpload values={form.image_urls} onChange={urls => upd("image_urls", urls)} />
      </div>
    </div>
  );
}

export default function StockPage() {
  const { data: items = [], mutate } = useStock();
  const { data: materials = [] } = useMaterials();
  const [showForm, setShowForm] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [form, setForm] = useState<ItemForm>({ ...blank });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ItemForm>({ ...blank });

  // ── Picker de catálogo ─────────────────────────────────────
  const applyFromCatalog = (c: any) => {
    setForm(prev => ({
      ...prev,
      name: c.name,
      description: c.description ?? "",
      image_urls: c.image_url ? [c.image_url] : [],
    }));
    setShowPicker(false);
    toast.success(`"${c.name}" importado do catálogo`);
  };

  // ── Criar ──────────────────────────────────────────────────
  const save = async () => {
    if (!form.name) { toast.error("Nome obrigatório"); return; }
    try {
      await api.post("/stock", formToPayload(form));
      toast.success("Item adicionado!");
      setForm({ ...blank });
      setShowForm(false);
      setShowPicker(false);
      mutate();
    } catch { toast.error("Erro ao salvar"); }
  };

  const openNewForm = () => {
    setShowForm(!showForm);
    setShowPicker(false);
    setEditingId(null);
  };

  // ── Editar ─────────────────────────────────────────────────
  const openEdit = (item: any) => {
    setEditingId(item.id);
    setEditForm(itemToForm(item));
    setShowForm(false);
    setShowPicker(false);
  };

  const saveEdit = async (id: number) => {
    if (!editForm.name) { toast.error("Nome obrigatório"); return; }
    try {
      await api.put(`/stock/${id}`, formToPayload(editForm));
      toast.success("Item atualizado!");
      setEditingId(null);
      mutate();
    } catch { toast.error("Erro ao salvar"); }
  };

  // ── Excluir ────────────────────────────────────────────────
  const del = async (id: number, name: string) => {
    if (!confirm(`Excluir "${name}"?`)) return;
    try {
      await api.delete(`/stock/${id}`);
      toast.success("Item excluído");
      mutate();
    } catch { toast.error("Erro ao excluir"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pronta Entrega</h1>
        <div className="flex gap-2">
          <a href="/" target="_blank" className="btn-ghost flex items-center gap-2 text-sm">
            <ExternalLink size={14} /> Ver Vitrine
          </a>
          <button onClick={openNewForm} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Novo Item
          </button>
        </div>
      </div>

      {/* Formulário de criação */}
      {showForm && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Novo Item</h2>
            <button onClick={() => { setShowForm(false); setShowPicker(false); }} className="text-slate-400 hover:text-white">
              <X size={16} />
            </button>
          </div>

          {/* Botão picker de catálogo */}
          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border transition-colors ${
              showPicker
                ? "border-blue-500 bg-blue-500/10 text-blue-400"
                : "border-slate-600 text-slate-400 hover:border-slate-400 hover:text-white"
            }`}
          >
            <BookOpen size={14} />
            {showPicker ? "Fechar catálogo" : "Importar do catálogo"}
          </button>

          {showPicker && <CatalogPicker onSelect={applyFromCatalog} />}

          <ItemFormFields form={form} setForm={setForm} materials={materials} />

          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowForm(false); setShowPicker(false); }} className="btn-ghost">Cancelar</button>
            <button onClick={save} className="btn-primary">Salvar</button>
          </div>
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item: any) => {
          const images: string[] = item.image_urls?.length
            ? item.image_urls
            : item.image_url ? [item.image_url] : [];
          const coverUrl = images[0] ?? null;

          if (editingId === item.id) {
            return (
              <div key={item.id} className="card space-y-4 md:col-span-2 lg:col-span-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Editando: {item.name}</h3>
                  <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-white"><X size={16} /></button>
                </div>
                <ItemFormFields form={editForm} setForm={setEditForm} materials={materials} />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditingId(null)} className="btn-ghost">Cancelar</button>
                  <button onClick={() => saveEdit(item.id)} className="btn-primary">Salvar Alterações</button>
                </div>
              </div>
            );
          }

          return (
            <div key={item.id} className={`card space-y-2 ${item.quantity === 0 ? "opacity-60" : ""}`}>
              {coverUrl && (
                <img src={coverUrl} alt={item.name} className="w-full h-36 object-cover rounded-lg" />
              )}
              {images.length > 1 && (
                <p className="text-xs text-slate-500">{images.length} fotos</p>
              )}
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium leading-tight">{item.name}</p>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(item)} className="btn-ghost p-1.5" title="Editar">
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => del(item.id, item.name)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {item.description && <p className="text-xs text-slate-400">{item.description}</p>}
              <div className="flex justify-between items-center">
                <span className="text-blue-400 font-semibold">R$ {item.sell_price.toFixed(2)}</span>
                <span className={`text-sm font-bold px-2 py-0.5 rounded ${item.quantity > 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                  {item.quantity} un.
                </span>
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <p className="text-slate-400 text-center py-12 col-span-3">Nenhum item em estoque.</p>
        )}
      </div>
    </div>
  );
}
