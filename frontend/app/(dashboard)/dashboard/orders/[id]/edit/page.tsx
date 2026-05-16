"use client";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { api } from "@/lib/api";
import { useOrder, useClients, useMaterials, useExtraServices, useSettings } from "@/lib/hooks";
import toast from "react-hot-toast";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import MaterialSelector, { MaterialRow } from "@/components/ui/MaterialSelector";
import OrderItemsEditor, { OrderItemRow } from "@/components/ui/OrderItemsEditor";

type FormData = {
  client_id: string;
  print_type: "FDM" | "Resin";
  estimated_time: string;
  deadline: string;
  down_payment: string;
  sell_price: string;
  notes: string;
  file_url: string;
  extra_services: { extra_service_id: string; price: string; notes: string }[];
};

function toLocalDatetime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: order } = useOrder(Number(id));
  const { data: clients = [] } = useClients();
  const { data: materials = [] } = useMaterials();
  const { data: extraServices = [] } = useExtraServices();
  const { data: settings } = useSettings();

  const { register, handleSubmit, watch, setValue, reset, control } = useForm<FormData>({
    defaultValues: { print_type: "FDM", extra_services: [] },
  });
  const { fields, append, remove, replace } = useFieldArray({ control, name: "extra_services" });

  const [materialRows, setMaterialRows] = useState<MaterialRow[]>([]);
  const [itemRows, setItemRows] = useState<OrderItemRow[]>([]);
  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!order || initialized) return;
    reset({
      client_id: order.client_id ? String(order.client_id) : "",
      print_type: order.print_type,
      estimated_time: order.estimated_time ? String(order.estimated_time) : "",
      deadline: toLocalDatetime(order.deadline),
      down_payment: String(order.down_payment ?? 0),
      sell_price: order.sell_price != null ? String(order.sell_price) : "",
      notes: order.notes ?? "",
      file_url: order.file_url ?? "",
      extra_services: (order.extra_services ?? []).map((es: any) => ({
        extra_service_id: String(es.extra_service_id),
        price: String(es.price),
        notes: es.notes ?? "",
      })),
    });
    if (order.items?.length > 0) {
      setItemRows(order.items.map((it: any) => ({
        item_name: it.item_name,
        quantity: String(it.quantity),
        unit_price: it.unit_price != null ? String(it.unit_price) : "",
      })));
    } else {
      setItemRows([{ item_name: order.item_name ?? "", quantity: "1", unit_price: order.sell_price != null ? String(order.sell_price) : "" }]);
    }
    if (order.materials?.length > 0) {
      setMaterialRows(order.materials.map((om: any) => ({
        material_id: String(om.material_id),
        estimated_weight: om.estimated_weight != null ? String(om.estimated_weight) : "",
      })));
    } else if (order.material_id) {
      setMaterialRows([{ material_id: String(order.material_id), estimated_weight: order.estimated_weight ? String(order.estimated_weight) : "" }]);
    }
    setInitialized(true);
  }, [order, initialized, reset]);

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

  const onSubmit = async (data: FormData) => {
    const validItems = itemRows.filter(r => r.item_name.trim());
    if (validItems.length === 0) {
      toast.error("Adicione ao menos um item ao pedido");
      return;
    }
    const validMaterials = materialRows.filter(r => r.material_id);
    try {
      await api.put(`/orders/${id}`, {
        client_id: data.client_id ? Number(data.client_id) : null,
        print_type: data.print_type,
        estimated_time: data.estimated_time ? Number(data.estimated_time) : null,
        deadline: data.deadline || null,
        down_payment: Number(data.down_payment) || 0,
        sell_price: data.sell_price ? Number(data.sell_price) : null,
        notes: data.notes || null,
        file_url: data.file_url || null,
        items: validItems.map(r => ({
          item_name: r.item_name.trim(),
          quantity: Number(r.quantity) || 1,
          unit_price: r.unit_price ? Number(r.unit_price) : null,
        })),
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
      toast.success("Pedido atualizado!");
      router.push(`/dashboard/orders/${id}`);
    } catch {
      toast.error("Erro ao salvar pedido");
    }
  };

  if (!order) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Carregando pedido...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="btn-ghost p-2">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold">Editar Pedido #{id}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="card space-y-4">
          <h2 className="font-semibold text-slate-300">Informações do Pedido</h2>
          <div>
            <label className="label">Itens do Pedido *</label>
            <OrderItemsEditor value={itemRows} onChange={setItemRows} />
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
              <input type="number" step="0.1" className="input" {...register("estimated_time")} />
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
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-slate-300">Financeiro</h2>
          {suggestedPrice !== null && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-blue-400 text-xs">Custo calculado + margem</p>
              <p className="text-blue-300 font-bold text-lg">R$ {suggestedPrice.toFixed(2)}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Preço de Venda (R$)</label>
              <input type="number" step="0.01" className="input" {...register("sell_price")} placeholder="0.00" />
            </div>
            <div>
              <label className="label">Sinal Recebido (R$)</label>
              <input type="number" step="0.01" className="input" {...register("down_payment")} placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className="label">Observações</label>
            <textarea className="input" rows={3} {...register("notes")} />
          </div>
        </div>

        <div className="flex gap-3 justify-end pb-6">
          <button type="button" onClick={() => router.back()} className="btn-ghost">Cancelar</button>
          <button type="submit" className="btn-primary">Salvar Alterações</button>
        </div>
      </form>
    </div>
  );
}
