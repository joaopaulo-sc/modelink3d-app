"use client";
import { useState } from "react";
import Link from "next/link";
import { useOrders } from "@/lib/hooks";
import { api } from "@/lib/api";
import { Plus, FileText, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import toast from "react-hot-toast";

const STATUS_LABELS: Record<string, string> = {
  Budget: "Orçamento", Queued: "Na Fila", Printing: "Imprimindo",
  PostProcessing: "Pós-Proc.", Finished: "Finalizado", Delivered: "Entregue",
};
const STATUS_COLORS: Record<string, string> = {
  Budget: "bg-slate-500/20 text-slate-400",
  Queued: "bg-yellow-500/20 text-yellow-400",
  Printing: "bg-blue-500/20 text-blue-400",
  PostProcessing: "bg-purple-500/20 text-purple-400",
  Finished: "bg-green-500/20 text-green-400",
  Delivered: "bg-emerald-500/20 text-emerald-400",
};

export default function OrdersPage() {
  const [filter, setFilter] = useState("");
  const { data: orders = [], mutate } = useOrders();

  const filtered = filter ? orders.filter((o: any) => o.status === filter) : orders;

  const downloadInvoice = async (id: number, name: string) => {
    try {
      const res = await api.get(`/orders/${id}/invoice`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pedido_${id}_${name}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Erro ao gerar recibo");
    }
  };

  const now = new Date();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <Link href="/dashboard/orders/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Novo Pedido
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["", ...Object.keys(STATUS_LABELS)].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filter === s ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            {s ? STATUS_LABELS[s] : "Todos"}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((order: any) => {
          const isUrgent = order.deadline && !["Finished","Delivered"].includes(order.status) &&
            (new Date(order.deadline).getTime() - now.getTime()) / 3600000 < 24;
          const isOverdue = order.deadline && !["Finished","Delivered"].includes(order.status) &&
            new Date(order.deadline) < now;
          return (
            <div key={order.id} className={`card flex items-center gap-3 ${isOverdue ? "border-red-500/50" : isUrgent ? "border-yellow-500/50" : ""}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">{order.item_name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                  {order.failure_count > 0 && (
                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                      {order.failure_count}x falha
                    </span>
                  )}
                </div>
                <div className="flex gap-4 mt-1 text-xs text-slate-400 flex-wrap">
                  {order.client_name && <span>{order.client_name}</span>}
                  {order.deadline && (
                    <span className={isOverdue ? "text-red-400 font-medium" : isUrgent ? "text-yellow-400" : ""}>
                      Prazo: {format(new Date(order.deadline), "dd/MM/yy", { locale: ptBR })}
                    </span>
                  )}
                  {order.sell_price && <span>R$ {order.sell_price.toFixed(2)}</span>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link href={`/dashboard/orders/${order.id}`} className="btn-ghost p-2">
                  <ExternalLink size={16} />
                </Link>
                <button onClick={() => downloadInvoice(order.id, order.item_name)} className="btn-ghost p-2">
                  <FileText size={16} />
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-slate-400 text-center py-12">Nenhum pedido encontrado.</p>
        )}
      </div>
    </div>
  );
}
