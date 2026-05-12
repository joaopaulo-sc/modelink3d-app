"use client";
import { useOrders } from "@/lib/hooks";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

const COLUMNS = [
  { key: "Budget", label: "Orçamento", color: "border-slate-500" },
  { key: "Queued", label: "Na Fila", color: "border-yellow-500" },
  { key: "Printing", label: "Imprimindo", color: "border-blue-500" },
  { key: "PostProcessing", label: "Pós-Proc.", color: "border-purple-500" },
  { key: "Finished", label: "Finalizado", color: "border-green-500" },
];

const NEXT_STATUS: Record<string, string> = {
  Budget: "Queued", Queued: "Printing", Printing: "PostProcessing", PostProcessing: "Finished",
};

export default function KanbanPage() {
  const { data: orders = [], mutate } = useOrders();
  const now = new Date();

  const advance = async (order: any) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    if (next === "Finished") {
      const weight = prompt(`Peso real consumido (gramas)? Estimado: ${order.estimated_weight ?? "?"}g`);
      if (!weight) return;
      try {
        await api.patch(`/orders/${order.id}/finish`, { actual_weight: Number(weight) });
        toast.success("Pedido finalizado!");
      } catch { toast.error("Erro"); }
    } else {
      try {
        await api.patch(`/orders/${order.id}/status`, { status: next });
      } catch { toast.error("Erro ao atualizar status"); }
    }
    mutate();
  };

  const fail = async (order: any) => {
    const notes = prompt("Motivo da falha:");
    const partial = prompt("Peso parcial consumido (g)? Deixe em branco se nenhum:");
    try {
      await api.patch(`/orders/${order.id}/failure`, {
        partial_weight_used: partial ? Number(partial) : null,
        notes,
      });
      toast.success("Falha registrada");
    } catch { toast.error("Erro"); }
    mutate();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Kanban de Produção</h1>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(({ key, label, color }) => {
          const col = orders.filter((o: any) => o.status === key);
          return (
            <div key={key} className={`shrink-0 w-72 bg-slate-800 rounded-xl border-t-2 ${color}`}>
              <div className="p-3 flex items-center justify-between">
                <span className="font-semibold text-sm">{label}</span>
                <span className="bg-slate-700 text-slate-400 text-xs px-2 py-0.5 rounded-full">{col.length}</span>
              </div>
              <div className="p-2 space-y-2 min-h-24">
                {col.map((order: any) => {
                  const isOverdue = order.deadline && new Date(order.deadline) < now;
                  const isUrgent = order.deadline && !isOverdue &&
                    (new Date(order.deadline).getTime() - now.getTime()) / 3600000 < 24;
                  return (
                    <div key={order.id} className={`bg-slate-700 rounded-lg p-3 space-y-2 border ${
                      isOverdue ? "border-red-500/50" : isUrgent ? "border-yellow-500/50" : "border-transparent"
                    }`}>
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-sm font-medium leading-tight">{order.item_name}</p>
                        <span className="text-xs bg-slate-600 px-1.5 rounded">{order.print_type}</span>
                      </div>
                      {order.client_name && <p className="text-xs text-slate-400">{order.client_name}</p>}
                      {order.deadline && (
                        <p className={`text-xs ${isOverdue ? "text-red-400 font-bold" : isUrgent ? "text-yellow-400" : "text-slate-400"}`}>
                          {isOverdue ? "⚠ ATRASADO" : `Prazo: ${format(new Date(order.deadline), "dd/MM HH:mm", { locale: ptBR })}`}
                        </p>
                      )}
                      {order.failure_count > 0 && (
                        <p className="text-xs text-red-400">{order.failure_count}x falha</p>
                      )}
                      <div className="flex gap-1 flex-wrap pt-1">
                        {NEXT_STATUS[key] && (
                          <button onClick={() => advance(order)} className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded transition-colors">
                            Avançar →
                          </button>
                        )}
                        {key === "Printing" && (
                          <button onClick={() => fail(order)} className="text-xs bg-red-600/80 hover:bg-red-600 px-2 py-1 rounded transition-colors">
                            Falha
                          </button>
                        )}
                        <Link href={`/dashboard/orders/${order.id}`} className="text-xs bg-slate-600 hover:bg-slate-500 px-2 py-1 rounded transition-colors">
                          Detalhes
                        </Link>
                      </div>
                    </div>
                  );
                })}
                {col.length === 0 && <p className="text-slate-500 text-xs text-center py-4">Vazio</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
