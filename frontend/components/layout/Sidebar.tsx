"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, Columns3, Users, Package, Printer, ShoppingBag, Settings, LogOut, BookOpen } from "lucide-react";
import { logout } from "@/lib/api";
import clsx from "clsx";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/orders", label: "Pedidos", icon: ClipboardList },
  { href: "/dashboard/kanban", label: "Kanban", icon: Columns3 },
  { href: "/dashboard/catalog", label: "Catálogo", icon: BookOpen },
  { href: "/dashboard/clients", label: "Clientes", icon: Users },
  { href: "/dashboard/materials", label: "Materiais", icon: Package },
  { href: "/dashboard/printers", label: "Impressoras", icon: Printer },
  { href: "/dashboard/stock", label: "Pronta Entrega", icon: ShoppingBag },
  { href: "/dashboard/settings", label: "Configurações", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-16 md:w-56 h-screen bg-slate-900 border-r border-slate-700 shrink-0">
      <div className="p-4 hidden md:block">
        <span className="text-blue-400 font-bold text-lg">ModelInk3D</span>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors text-sm",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Icon size={18} className="shrink-0" />
            <span className="hidden md:block">{label}</span>
          </Link>
        ))}
      </nav>
      <button
        onClick={logout}
        className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 transition-colors text-sm"
      >
        <LogOut size={18} />
        <span className="hidden md:block">Sair</span>
      </button>
    </aside>
  );
}
