"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useOrder, usePrinters, useMaterials } from "@/lib/hooks";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, FileText, AlertTriangle, ChevronRight, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  Budget: "Orçamento", Queued: "Na Fila", Printing: "Imprimindo",
  PostProcessing: "Pós-Processamento", Finished: "Finalizado", Delivered: "Entregue",
};
const STATUS_COLORS: Record<string, string> = {
  Budget: "bg-slate-500/20 text-slate-400",
  Queued: "bg-yellow-500/20 text-yellow-400",
  Printing: "bg-blue-500/20 text-blue-400",
  PostProcessing: "bg-purple-500/20 text-purple-400",
  Finished: "bg-green-500/20 text-green-400",
  Delivered: "bg-emerald-500/20 text-emerald-400",
};
const NEXT_STATUS: Record<string, string> = {
  Budget: "Queued", Queued: "Printing", Printing: "PostProcessing", PostProcessing: "Finished", Finished: "Delivered",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card space-y-3">
      <h2 className="font-semibold text-slate-300 text-sm uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4 text-sm">
      <span className="text-slate-400 shrink-0">{label}</span>
      <span className="text-right font-medium">{value ?? "—"}</span>
    </div>
  );
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: order, mutate } = useOrder(Number(id));
  const { data: printers = [] } = usePrinters();
  const { data: materials = [] } = useMaterials();

  const [advanceLoading, setAdvanceLoading] = useState(false);

  if (!order) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Carregando pedido...</p>
      </div>
    );
  }

  const now = new Date();
  const isOverdue = order.deadline && !["Finished", "Delivered"].includes(order.status) && new Date(order.deadline) < now;
  const isUrgent = order.deadline && !isOverdue && !["Finished", "Delivered"].includes(order.status) &&
    (new Date(order.deadline).getTime() - now.getTime()) / 3600000 < 24;

  const nextStatus = NEXT_STATUS[order.status];
  const printer = printers.find((p: any) => p.id === order.printer_id);
  const material = materials.find((m: any) => m.id === order.material_id);

  const advance = async () => {
    if (!nextStatus) return;
    setAdvanceLoading(true);
    try {
      if (nextStatus === "Finished") {
        const weight = prompt(
          `Confirme o peso real consumido (g).\nEstimado: ${order.estimated_weight ?? "?"}g`
        );
        if (!weight) { setAdvanceLoading(false); return; }
        await api.patch(`/orders/${order.id}/finish`, { actual_weight: Number(weight) });
        toast.success("Pedido finalizado! Estoque atualizado.");
      } else {
        let printerIdToAssign: number | undefined;
        if (nextStatus === "Printing") {
          const printerList = printers.map((p: any, i: number) => `${i + 1}. ${p.name}`).join("\n");
          const choice = prompt(`Atribuir a qual impressora?\n${printerList}\n\nDigite o número:`);
          if (choice) {
            const idx = Number(choice) - 1;
            if (printers[idx]) printerIdToAssign = printers[idx].id;
          }
          if (printerIdToAssign) {
            await api.patch(`/orders/${order.id}`, { printer_id: printerIdToAssign });
            await api.patch(`/printers/${printerIdToAssign}`, { status: "Printing" });
          }
        }
        if (order.status === "Printing" && printer) {
          await api.patch(`/printers/${printer.id}`, { status: "Idle" });
        }
        await api.patch(`/orders/${order.id}/status`, { status: nextStatus });
      }
      await mutate();
      toast.success(`Status: ${STATUS_LABELS[nextStatus]}`);
    } catch {
      toast.error("Erro ao atualizar status");
    } finally {
      setAdvanceLoading(false);
    }
  };

  const registerFailure = async () => {
    const notes = prompt("Descreva o motivo da falha:");
    if (notes === null) return;
    const partial = prompt("Peso de material consumido antes da falha (g)? Deixe vazio se nenhum:");
    try {
      await api.patch(`/orders/${order.id}/failure`, {
        partial_weight_used: partial ? Number(partial) : null,
        notes,
      });
      if (printer) await api.patch(`/printers/${printer.id}`, { status: "Idle" });
      await mutate();
      toast.success("Falha registrada. Pedido voltou para a fila.");
    } catch {
      toast.error("Erro ao registrar falha");
    }
  };

  const downloadInvoice = async () => {
    try {
      const res = await api.get(`/orders/${order.id}/invoice`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pedido_${order.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Erro ao gerar recibo");
    }
  };

  const remaining = (order.sell_price ?? 0) - (order.down_payment ?? 0);

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="btn-ghost p-2">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">
            {order.item_name || (order.items?.[0]?.item_name ?? `Pedido #${order.id}`)}
          </h1>
          <p className="text-slate-400 text-sm">Pedido #{order.id}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href={`/dashboard/orders/${id}/edit`} className="btn-ghost flex items-center gap-2 text-sm">
            <Pencil size={16} /> Editar
          </Link>
          <button onClick={downloadInvoice} className="btn-ghost flex items-center gap-2 text-sm">
            <FileText size={16} /> Recibo
          </button>
        </div>
      </div>

      {/* Alertas de prazo */}
      {isOverdue && (
        <div className="bg-red-500/10 border border-red-500/40 rounded-xl px-4 py-3 flex items-center gap-2 text-red-400 text-sm font-medium">
          <AlertTriangle size={16} /> Prazo vencido em {format(new Date(order.deadline!), "dd/MM/yyyy HH:mm", { locale: ptBR })}
        </div>
      )}
      {isUrgent && !isOverdue && (
        <div className="bg-yellow-500/10 border border-yellow-500/40 rounded-xl px-4 py-3 flex items-center gap-2 text-yellow-400 text-sm font-medium">
          <AlertTriangle size={16} /> Prazo em {format(new Date(order.deadline!), "dd/MM/yyyy HH:mm", { locale: ptBR })}
        </div>
      )}

      {/* Status e ações */}
      <Section title="Status">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[order.status]}`}>
            {STATUS_LABELS[order.status]}
          </span>
          {order.failure_count > 0 && (
            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
              {order.failure_count}x falha registrada
            </span>
          )}
        </div>

        <div className="flex gap-2 flex-wrap pt-1">
          {nextStatus && (
            <button
              onClick={advance}
              disabled={advanceLoading}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <ChevronRight size={16} />
              Avançar para {STATUS_LABELS[nextStatus]}
            </button>
          )}
          {order.status === "Printing" && (
            <button onClick={registerFailure} className="flex items-center gap-2 text-sm bg-red-600/80 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors">
              <AlertTriangle size={16} /> Registrar Falha
            </button>
          )}
        </div>

        {/* Timeline */}
        {order.status_history?.length > 0 && (
          <div className="mt-2 space-y-1 border-t border-slate-700 pt-3">
            <p className="text-xs text-slate-500 mb-2">Histórico</p>
            {[...order.status_history].reverse().map((h: any) => (
              <div key={h.id} className="flex justify-between text-xs text-slate-400">
                <span className={`${STATUS_COLORS[h.status]} px-2 py-0.5 rounded-full`}>
                  {STATUS_LABELS[h.status]}
                </span>
                <span>{format(new Date(h.changed_at), "dd/MM/yy HH:mm", { locale: ptBR })}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Itens do pedido */}
      {order.items?.length > 0 && (
        <Section title="Itens do Pedido">
          <div className="space-y-2">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between text-sm gap-4">
                <span className="font-medium flex-1">{item.item_name}</span>
                <span className="text-slate-400 shrink-0">x{item.quantity}</span>
                {item.unit_price != null && (
                  <span className="text-slate-300 shrink-0">
                    R$ {(item.unit_price * item.quantity).toFixed(2)}
                  </span>
                )}
              </div>
            ))}
            {order.items.some((it: any) => it.unit_price != null) && (
              <div className="flex justify-between text-sm font-semibold border-t border-slate-700 pt-2 mt-1">
                <span className="text-slate-400">Subtotal dos itens</span>
                <span>R$ {order.items.reduce((s: number, it: any) => s + (it.unit_price || 0) * it.quantity, 0).toFixed(2)}</span>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Detalhes da peça */}
      <Section title="Detalhes">
        <Row label="Tipo" value={order.print_type} />
        <Row label="Peso estimado" value={order.estimated_weight ? `${order.estimated_weight}g` : null} />
        <Row label="Peso real" value={order.actual_weight ? `${order.actual_weight}g` : null} />
        <Row label="Tempo estimado" value={order.estimated_time ? `${order.estimated_time}h` : null} />
        {order.materials?.length > 0 ? (
          <div className="flex justify-between items-start gap-4 text-sm">
            <span className="text-slate-400 shrink-0">Materiais</span>
            <div className="text-right space-y-0.5">
              {order.materials.map((om: any) => (
                <p key={om.id} className="font-medium">
                  {om.material_name ?? `Material #${om.material_id}`}
                  {om.estimated_weight ? ` · ${om.estimated_weight}g` : ""}
                </p>
              ))}
            </div>
          </div>
        ) : (
          <Row label="Material" value={material ? `${material.brand} ${material.material_type} ${material.color}` : null} />
        )}
        <Row label="Impressora" value={printer?.name} />
        {order.deadline && (
          <Row label="Prazo" value={format(new Date(order.deadline), "dd/MM/yyyy HH:mm", { locale: ptBR })} />
        )}
        {order.file_url && (
          <Row label="Arquivo 3D" value={
            <a href={order.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline truncate max-w-[180px] inline-block">
              Abrir link
            </a>
          } />
        )}
        {order.notes && (
          <div className="text-sm bg-slate-700 rounded-lg p-3 text-slate-300 whitespace-pre-wrap">
            {order.notes}
          </div>
        )}
      </Section>

      {/* Cliente */}
      {order.client_name && (
        <Section title="Cliente">
          <div className="flex items-center justify-between">
            <span className="font-medium">{order.client_name}</span>
            {order.client_id && (
              <Link href={`/dashboard/clients`} className="text-blue-400 text-xs underline">
                Ver histórico
              </Link>
            )}
          </div>
        </Section>
      )}

      {/* Serviços extras */}
      {order.extra_services?.length > 0 && (
        <Section title="Serviços Extras">
          {order.extra_services.map((es: any) => (
            <div key={es.id} className="flex justify-between text-sm">
              <span>{es.extra_service_name ?? `Serviço #${es.extra_service_id}`}</span>
              <span className="font-medium">R$ {es.price.toFixed(2)}</span>
            </div>
          ))}
        </Section>
      )}

      {/* Financeiro */}
      <Section title="Financeiro">
        <Row label="Custo estimado" value={order.cost_price ? `R$ ${order.cost_price.toFixed(2)}` : null} />
        <Row label="Preço de venda" value={order.sell_price != null ? `R$ ${order.sell_price.toFixed(2)}` : null} />
        <Row label="Sinal recebido" value={`R$ ${(order.down_payment ?? 0).toFixed(2)}`} />
        <div className="flex justify-between text-sm font-bold border-t border-slate-700 pt-2 mt-1">
          <span>Restante a receber</span>
          <span className={remaining > 0 ? "text-yellow-400" : "text-green-400"}>
            R$ {remaining.toFixed(2)}
          </span>
        </div>
      </Section>
    </div>
  );
}
