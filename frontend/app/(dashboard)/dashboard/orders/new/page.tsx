"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { api } from "@/lib/api";
import { useClients, useMaterials, useExtraServices, useSettings, useCatalog } from "@/lib/hooks";
import toast from "react-hot-toast";
import { Plus, Trash2, BookOpen, X } from "lucide-react";
import MaterialSelector, { MaterialRow } from "@/components/ui/MaterialSelector";

type FormData = {
  client_id: string;
  item_name: string;
  print_type: "FDM" | "Resin";
  estimated_time: string;
  deadline: string;
  down_payment: string;
  notes: string;
  file_url: string;
  extra_services: { extra_service_id: string; price: string; notes: string }[];
};

export default function NewOrderPage() {
  const router = useRouter();
  const { data: clients = [] } = useClients();
  const { data: materials = [] } = useMaterials();
  const { data: extraServices = [] } = useExtraServices();
  const { data: settings } = useSettings();
  const { data: catalogItems = [] } = useCatalog();

  const { register, handleSubmit, watch, setValue, control } = useForm<FormData>({
    defaultValues: { print_type: "FDM", extra_services: [] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "extra_services" });

  const [materialRows, setMaterialRows] = useState<MaterialRow[]>([]);
  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);
  const [sellPrice, setSellPrice] = useState("");
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<any>(null);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [showCatalogPicker, setShowCatalogPicker] = useState(false);

  const watchedTime = watch("estimated_time");
  const watchedType = watch("print_type");
  const watchedExtras = watch("extra_services");

  useEffect(() => {
    if (!settings) return;
    const rate = watchedType === "FDM" ? settings.fdm_rate_per_hour : settings.resin_rate_per_hour;
    const matCost = materialRows.reduce((sum, row) => {
      const mat = materials.find((m: any) => m.id === Number(row.material_id));
      return sum + (mat ? (Number(row.estimated_weight) || 0) * (mat.price_per_gram || 0) : 0);
    }, 0);
    const timeCost = (Number(watchedTime) || 0) * rate;
    const extraCost = watchedExtras.reduce((s: number, e: any) => s + (Number(e.price) || 0), 0);
    const base = matCost + timeCost + extraCost;
    const suggested = base * (1 + settings.default_margin);
    setSuggestedPrice(suggested > 0 ? suggested : null);
  }, [materialRows, watchedTime, watchedType, watchedExtras, settings, materials]);

  const applyCatalogItem = (item: any) => {
    setValue("item_name", item.name);
    setValue("print_type", item.print_type);
    if (item.default_time) setValue("estimated_time", String(item.default_time));
    if (item.file_url) setValue("file_url", item.file_url);
    if (item.notes) setValue("notes", item.notes);
    setSelectedCatalogItem(item);
    setShowCatalogPicker(false);
    setCatalogSearch("");
    toast.success(`"${item.name}" aplicado ao pedido`);
  };

  const filteredCatalog = catalogItems.filter((i: any) =>
    i.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    (i.description ?? "").toLowerCase().includes(catalogSearch.toLowerCase())
  );

  const onSubmit = async (data: FormData) => {
    const validMaterials = materialRows.filter(r => r.material_id);
    try {
      await api.post("/orders", {
        client_id: data.client_id ? Number(data.client_id) : null,
        item_name: data.item_name,
        print_type: data.print_type,
        estimated_time: data.estimated_time ? Number(data.estimated_time) : null,
        deadline: data.deadline || null,
        down_payment: Number(data.down_payment) || 0,
        sell_price: sellPrice ? Number(sellPrice) : (suggestedPrice ?? null),
        notes: data.notes || null,
        file_url: data.file_url || null,
        materials: validMaterials.map(r => ({
          material_id: Number(r.material_id),
          estimated_weight: r.estimated_weight ? Number(r.estimated_weight) : null,
        })),
        extra_services: data.extra_services.map((e) => ({
          extra_service_id: Number(e.extra_service_id),
          price: Number(e.price),
          notes: e.notes || null,
        })),
      });
      toast.success("Pedido criado!");
      router.push("/dashboard/orders");
    } catch {
      toast.error("Erro ao criar pedido");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Novo Pedido</h1>

      {/* Seletor do catálogo */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <BookOpen size={16} className="text-blue-400" /> Selecionar do Catálogo
          </h2>
          {selectedCatalogItem ? (
            <button onClick={() => setSelectedCatalogItem(null)} className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1">
              <X size={12} /> Limpar
            </button>
          ) : (
            <button type="button" onClick={() => setShowCatalogPicker(!showCatalogPicker)} className="btn-ghost text-sm flex items-center gap-1">
              <BookOpen size={14} /> {showCatalogPicker ? "Fechar" : "Escolher item"}
            </button>
          )}
        </div>

        {selectedCatalogItem && (
          <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            {selectedCatalogItem.image_url && (
              <img src={selectedCatalogItem.image_url} alt="" className="w-12 h-12 rounded object-cover shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-blue-300">{selectedCatalogItem.name}</p>
              <p className="text-xs text-slate-400">
                {selectedCatalogItem.print_type}
                {selectedCatalogItem.default_time && ` · ${selectedCatalogItem.default_time}h`}
              </p>
            </div>
            <button type="button" onClick={() => setShowCatalogPicker(true)} className="text-xs text-blue-400 underline shrink-0">
              Trocar
            </button>
          </div>
        )}

        {showCatalogPicker && (
          <div className="space-y-2">
            <input
              className="input"
              placeholder="Buscar no catálogo..."
              value={catalogSearch}
              onChange={e => setCatalogSearch(e.target.value)}
              autoFocus
            />
            <div className="max-h-56 overflow-y-auto space-y-1">
              {filteredCatalog.length === 0 && (
                <p className="text-slate-400 text-sm text-center py-4">
                  {catalogItems.length === 0 ? "Catálogo vazio." : "Nenhum item encontrado."}
                </p>
              )}
              {filteredCatalog.map((item: any) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => applyCatalogItem(item)}
                  className="w-full text-left flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-slate-700 flex items-center justify-center shrink-0">
                      <BookOpen size={16} className="text-slate-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-slate-400">
                      {item.print_type}
                      {item.default_time && ` · ${item.default_time}h`}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                    item.print_type === "FDM" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"
                  }`}>{item.print_type}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {catalogItems.length === 0 && !showCatalogPicker && (
          <p className="text-slate-500 text-xs">
            Catálogo vazio.{" "}
            <a href="/dashboard/catalog" className="text-blue-400 underline">Cadastrar itens →</a>
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="card space-y-4">
          <h2 className="font-semibold text-slate-300">Informações do Pedido</h2>
          <div>
            <label className="label">Nome da Peça *</label>
            <input className="input" {...register("item_name", { required: true })} placeholder="Ex: Suporte parede" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tipo de Impressão</label>
              <select className="input" {...register("print_type")}>
                <option value="FDM">FDM</option>
                <option value="Resin">Resina</option>
              </select>
            </div>
            <div>
              <label className="label">Cliente</label>
              <select className="input" {...register("client_id")}>
                <option value="">— Sem cliente —</option>
                {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tempo Est. (horas)</label>
              <input type="number" step="0.1" className="input" {...register("estimated_time")} placeholder="2.5" />
            </div>
            <div>
              <label className="label">Prazo de Entrega</label>
              <input type="datetime-local" className="input" {...register("deadline")} />
            </div>
          </div>
          <div>
            <label className="label">Materiais</label>
            <MaterialSelector materials={materials} value={materialRows} onChange={setMaterialRows} />
          </div>
          <div>
            <label className="label">Link do Arquivo 3D</label>
            <input className="input" {...register("file_url")} placeholder="https://..." />
          </div>
        </div>

        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-300">Serviços Extras</h2>
            <button
              type="button"
              onClick={() => append({ extra_service_id: "", price: "", notes: "" })}
              className="btn-ghost flex items-center gap-1 text-sm"
            >
              <Plus size={14} /> Adicionar
            </button>
          </div>
          {fields.map((field, i) => (
            <div key={field.id} className="flex gap-2 items-end">
              <div className="flex-1">
                <select className="input" {...register(`extra_services.${i}.extra_service_id`)}>
                  <option value="">Serviço...</option>
                  {extraServices.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="w-28">
                <input type="number" step="0.01" className="input" placeholder="R$" {...register(`extra_services.${i}.price`)} />
              </div>
              <button type="button" onClick={() => remove(i)} className="text-red-400 p-2">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {extraServices.length === 0 && fields.length === 0 && (
            <p className="text-slate-500 text-xs">
              Sem serviços extras.{" "}
              <a href="/dashboard/settings" className="text-blue-400 underline">Configurar →</a>
            </p>
          )}
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-slate-300">Financeiro</h2>
          {suggestedPrice !== null && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-xs">Preço sugerido (custo + margem)</p>
                <p className="text-blue-300 font-bold text-xl">R$ {suggestedPrice.toFixed(2)}</p>
              </div>
              {!sellPrice && (
                <button type="button" onClick={() => setSellPrice(suggestedPrice.toFixed(2))} className="text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors">
                  Usar este valor
                </button>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Preço de Venda (R$)</label>
              <input
                type="number" step="0.01" className="input"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                placeholder={suggestedPrice ? suggestedPrice.toFixed(2) : "0.00"}
              />
            </div>
            <div>
              <label className="label">Sinal Recebido (R$)</label>
              <input type="number" step="0.01" className="input" {...register("down_payment")} placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className="label">Observações</label>
            <textarea className="input" rows={3} {...register("notes")} placeholder="Cor especial, detalhes de acabamento..." />
          </div>
        </div>

        <div className="flex gap-3 justify-end pb-6">
          <button type="button" onClick={() => router.back()} className="btn-ghost">Cancelar</button>
          <button type="submit" className="btn-primary">Criar Pedido</button>
        </div>
      </form>
    </div>
  );
}
