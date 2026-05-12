"use client";
import { useState } from "react";
import { useClients } from "@/lib/hooks";
import { api } from "@/lib/api";
import { Plus, MessageCircle, Instagram } from "lucide-react";
import toast from "react-hot-toast";

export default function ClientsPage() {
  const { data: clients = [], mutate } = useClients();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", whatsapp: "", instagram: "", address: "" });

  const save = async () => {
    if (!form.name) { toast.error("Nome é obrigatório"); return; }
    try {
      await api.post("/clients", form);
      toast.success("Cliente cadastrado!");
      setForm({ name: "", whatsapp: "", instagram: "", address: "" });
      setShowForm(false);
      mutate();
    } catch { toast.error("Erro ao salvar"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Novo Cliente
        </button>
      </div>

      {showForm && (
        <div className="card space-y-3">
          <h2 className="font-semibold">Novo Cliente</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className="label">Nome *</label><input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div><label className="label">WhatsApp</label><input className="input" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} placeholder="5511999999999" /></div>
            <div><label className="label">Instagram</label><input className="input" value={form.instagram} onChange={e => setForm({...form, instagram: e.target.value})} placeholder="@usuario" /></div>
            <div><label className="label">Endereço</label><input className="input" value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="btn-ghost">Cancelar</button>
            <button onClick={save} className="btn-primary">Salvar</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {clients.map((c: any) => (
          <div key={c.id} className="card flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold shrink-0">
              {c.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">{c.name}</p>
              {c.address && <p className="text-xs text-slate-400 truncate">{c.address}</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              {c.whatsapp && (
                <a href={`https://wa.me/${c.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer" className="btn-ghost p-2 text-green-400">
                  <MessageCircle size={18} />
                </a>
              )}
              {c.instagram && (
                <a href={`https://instagram.com/${c.instagram.replace("@","")}`} target="_blank" rel="noopener noreferrer" className="btn-ghost p-2 text-pink-400">
                  <Instagram size={18} />
                </a>
              )}
            </div>
          </div>
        ))}
        {clients.length === 0 && <p className="text-slate-400 text-center py-12">Nenhum cliente cadastrado.</p>}
      </div>
    </div>
  );
}
