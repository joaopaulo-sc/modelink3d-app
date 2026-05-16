"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import useSWR from "swr";
import toast from "react-hot-toast";
import { Plus, Trash2, X, UserRound } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const fetcher = (url: string) => api.get(url).then(r => r.data);

const blank = { email: "", password: "", confirm: "" };

export default function UsersPage() {
  const { data: users = [], mutate } = useSWR("/users", fetcher);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...blank });
  const [loading, setLoading] = useState(false);

  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.email) { toast.error("E-mail obrigatório"); return; }
    if (form.password.length < 6) { toast.error("Senha deve ter ao menos 6 caracteres"); return; }
    if (form.password !== form.confirm) { toast.error("As senhas não coincidem"); return; }
    setLoading(true);
    try {
      await api.post("/users", { email: form.email, password: form.password });
      toast.success("Usuário criado!");
      setForm({ ...blank });
      setShowForm(false);
      mutate();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Erro ao criar usuário");
    } finally {
      setLoading(false);
    }
  };

  const del = async (id: number, email: string) => {
    if (!confirm(`Excluir o usuário "${email}"?`)) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success("Usuário excluído");
      mutate();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Erro ao excluir");
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuários</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Novo Usuário
        </button>
      </div>

      {showForm && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Novo Usuário</h2>
            <button onClick={() => { setShowForm(false); setForm({ ...blank }); }} className="text-slate-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="label">E-mail *</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={e => upd("email", e.target.value)}
                placeholder="usuario@exemplo.com"
                autoComplete="off"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Senha *</label>
                <input
                  type="password"
                  className="input"
                  value={form.password}
                  onChange={e => upd("password", e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="label">Confirmar Senha *</label>
                <input
                  type="password"
                  className="input"
                  value={form.confirm}
                  onChange={e => upd("confirm", e.target.value)}
                  placeholder="Repita a senha"
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowForm(false); setForm({ ...blank }); }} className="btn-ghost">Cancelar</button>
            <button onClick={save} disabled={loading} className="btn-primary">
              {loading ? "Criando..." : "Criar Usuário"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {users.map((u: any) => (
          <div key={u.id} className="card flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0">
              <UserRound size={18} className="text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{u.email}</p>
              <p className="text-xs text-slate-400">
                Criado em {format(new Date(u.created_at), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
            <button
              onClick={() => del(u.id, u.email)}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors shrink-0"
              title="Excluir usuário"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {users.length === 0 && (
          <p className="text-slate-400 text-center py-12">Nenhum usuário cadastrado além do administrador.</p>
        )}
      </div>
    </div>
  );
}
