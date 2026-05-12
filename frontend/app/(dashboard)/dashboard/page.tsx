"use client";
import { useOrders, useMaterials, usePrinters } from "@/lib/hooks";
import { AlertTriangle, ClipboardList, Printer, Package } from "lucide-react";
import Link from "next/link";

function StatCard({ label, value, sub, icon: Icon, warn }: { label: string; value: string | number; sub?: string; icon: React.ElementType; warn?: boolean }) {
  return (
    <div className={`card flex items-center gap-4 ${warn ? "border-yellow-500/50" : ""}`}>
      <div className={`p-3 rounded-lg ${warn ? "bg-yellow-500/20" : "bg-blue-600/20"}`}>
        <Icon size={20} className={warn ? "text-yellow-400" : "text-blue-400"} />
      </div>
      <div>
        <p className="text-slate-400 text-xs">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-slate-400 text-xs">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: orders = [] } = useOrders();
  const { data: materials = [] } = useMaterials();
  const { data: printers = [] } = usePrinters();

  const active = orders.filter((o: any) => !["Finished", "Delivered"].includes(o.status)).length;
  const lowStock = materials.filter((m: any) => m.low_stock).length;
  const printing = printers.filter((p: any) => p.status === "Printing").length;

  const now = new Date();
  const urgent = orders.filter((o: any) => {
    if (!o.deadline || ["Finished", "Delivered"].includes(o.status)) return false;
    const diff = (new Date(o.deadline).getTime() - now.getTime()) / 3600000;
    return diff < 24;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Pedidos Ativos" value={active} icon={ClipboardList} />
        <StatCard label="Imprimindo Agora" value={printing} sub={`de ${printers.length} máquinas`} icon={Printer} />
        <StatCard label="Materiais Baixos" value={lowStock} icon={Package} warn={lowStock > 0} />
        <StatCard label="Prazos Urgentes" value={urgent.length} icon={AlertTriangle} warn={urgent.length > 0} />
      </div>

      {lowStock > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <p className="text-yellow-400 font-medium flex items-center gap-2">
            <AlertTriangle size={16} /> {lowStock} material(is) abaixo do estoque mínimo
          </p>
          <Link href="/dashboard/materials" className="text-yellow-300 text-sm underline mt-1 inline-block">
            Ver materiais →
          </Link>
        </div>
      )}

      {urgent.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-red-400 font-medium mb-2 flex items-center gap-2">
            <AlertTriangle size={16} /> Pedidos com prazo urgente
          </p>
          <div className="space-y-1">
            {urgent.map((o: any) => {
              const diff = (new Date(o.deadline).getTime() - now.getTime()) / 3600000;
              const overdue = diff < 0;
              return (
                <div key={o.id} className="flex justify-between text-sm">
                  <span>{o.item_name}</span>
                  <span className={overdue ? "text-red-400 font-bold" : "text-yellow-400"}>
                    {overdue ? "ATRASADO" : `${Math.round(diff)}h restantes`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold mb-3">Status das Impressoras</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {printers.map((p: any) => (
            <div key={p.id} className="bg-slate-700 rounded-lg p-3">
              <p className="text-sm font-medium truncate">{p.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                p.status === "Idle" ? "bg-green-500/20 text-green-400" :
                p.status === "Printing" ? "bg-blue-500/20 text-blue-400" :
                "bg-red-500/20 text-red-400"
              }`}>
                {p.status === "Idle" ? "Disponível" : p.status === "Printing" ? "Imprimindo" : "Manutenção"}
              </span>
            </div>
          ))}
          {printers.length === 0 && (
            <p className="text-slate-400 text-sm col-span-4">
              Nenhuma impressora cadastrada.{" "}
              <Link href="/dashboard/printers" className="text-blue-400 underline">Cadastrar</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
