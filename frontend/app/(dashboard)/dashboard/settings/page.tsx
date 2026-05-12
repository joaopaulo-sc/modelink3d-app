"use client";
import { useEffect, useState } from "react";
import { useSettings, useExtraServices } from "@/lib/hooks";
import { api, changePassword, logout } from "@/lib/api";
import { Plus, Trash2, Lock, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { data: settings, mutate: mutateSett } = useSettings();
  const { data: services = [], mutate: mutateServices } = useExtraServices();

  const [form, setForm] = useState({ fdm_rate_per_hour: "", resin_rate_per_hour: "", default_margin: "", default_min_alert_weight: "", whatsapp_number: "" });
  const [svcForm, setSvcForm] = useState({ name: "", default_price: "", estimated_time_hours: "" });
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    if (settings) setForm({
      fdm_rate_per_hour: String(settings.fdm_rate_per_hour),
      resin_rate_per_hour: String(settings.resin_rate_per_hour),
      default_margin: String((settings.default_margin * 100).toFixed(0)),
      default_min_alert_weight: String(settings.default_min_alert_weight),
      whatsapp_number: settings.whatsapp_number ?? "",
    });
  }, [settings]);

  const saveSettings = async () => {
    try {
      await api.put("/settings", {
        fdm_rate_per_hour: Number(form.fdm_rate_per_hour),
        resin_rate_per_hour: Number(form.resin_rate_per_hour),
        default_margin: Number(form.default_margin) / 100,
        default_min_alert_weight: Number(form.default_min_alert_weight),
        whatsapp_number: form.whatsapp_number || null,
      });
      toast.success("Configurações salvas!");
      mutateSett();
    } catch { toast.error("Erro ao salvar"); }
  };

  const handleChangePassword = async () => {
    if (pwForm.next !== pwForm.confirm) { toast.error("As senhas não coincidem"); return; }
    if (pwForm.next.length < 6) { toast.error("Nova senha deve ter ao menos 6 caracteres"); return; }
    setPwLoading(true);
    try {
      await changePassword(pwForm.current, pwForm.next);
      toast.success("Senha alterada! Faça login novamente.");
      setPwForm({ current: "", next: "", confirm: "" });
      setTimeout(logout, 1500);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Erro ao alterar senha");
    } finally {
      setPwLoading(false);
    }
  };

  const addService = async () => {
    if (!svcForm.name) { toast.error("Nome obrigatório"); return; }
    try {
      await api.post("/extra-services", {
        name: svcForm.name,
        default_price: Number(svcForm.default_price) || 0,
        estimated_time_hours: svcForm.estimated_time_hours ? Number(svcForm.estimated_time_hours) : null,
      });
      setSvcForm({ name: "", default_price: "", estimated_time_hours: "" });
      toast.success("Serviço adicionado!");
      mutateServices();
    } catch { toast.error("Erro"); }
  };

  const deleteService = async (id: number) => {
    if (!confirm("Excluir serviço?")) return;
    try {
      await api.delete(`/extra-services/${id}`);
      mutateServices();
    } catch { toast.error("Erro"); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <div className="card space-y-4">
        <h2 className="font-semibold">Parâmetros de Precificação</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Taxa FDM (R$/hora)</label>
            <input type="number" step="0.01" className="input" value={form.fdm_rate_per_hour} onChange={e => setForm({...form, fdm_rate_per_hour: e.target.value})} />
          </div>
          <div>
            <label className="label">Taxa Resina (R$/hora)</label>
            <input type="number" step="0.01" className="input" value={form.resin_rate_per_hour} onChange={e => setForm({...form, resin_rate_per_hour: e.target.value})} />
          </div>
          <div>
            <label className="label">Margem de Lucro (%)</label>
            <input type="number" className="input" value={form.default_margin} onChange={e => setForm({...form, default_margin: e.target.value})} />
          </div>
          <div>
            <label className="label">Alerta Estoque Mín. (g)</label>
            <input type="number" className="input" value={form.default_min_alert_weight} onChange={e => setForm({...form, default_min_alert_weight: e.target.value})} />
          </div>
        </div>
        <button onClick={saveSettings} className="btn-primary">Salvar Configurações</button>
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><MessageCircle size={16} /> Atendimento via WhatsApp</h2>
        <p className="text-xs text-slate-400">
          Número exibido na vitrine pública. Use o formato internacional sem espaços ou traços —
          ex.: <span className="font-mono text-slate-300">5511999999999</span> (55 = Brasil, 11 = DDD).
        </p>
        <div>
          <label className="label">Número do WhatsApp</label>
          <input
            className="input"
            placeholder="5511999999999"
            value={form.whatsapp_number}
            onChange={e => setForm({ ...form, whatsapp_number: e.target.value.replace(/\D/g, "") })}
            maxLength={15}
          />
        </div>
        <button onClick={saveSettings} className="btn-primary">Salvar Configurações</button>
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><Lock size={16} /> Segurança — Alterar Senha</h2>
        <div className="space-y-3">
          <div>
            <label className="label">Senha Atual</label>
            <input type="password" className="input" value={pwForm.current} onChange={e => setPwForm({...pwForm, current: e.target.value})} autoComplete="current-password" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Nova Senha</label>
              <input type="password" className="input" value={pwForm.next} onChange={e => setPwForm({...pwForm, next: e.target.value})} autoComplete="new-password" />
            </div>
            <div>
              <label className="label">Confirmar Nova Senha</label>
              <input type="password" className="input" value={pwForm.confirm} onChange={e => setPwForm({...pwForm, confirm: e.target.value})} autoComplete="new-password" />
            </div>
          </div>
          <button onClick={handleChangePassword} disabled={pwLoading || !pwForm.current || !pwForm.next} className="btn-primary">
            {pwLoading ? "Salvando..." : "Alterar Senha"}
          </button>
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold">Serviços Extras</h2>
        <div className="flex gap-2">
          <input className="input flex-1" placeholder="Nome do serviço" value={svcForm.name} onChange={e => setSvcForm({...svcForm, name: e.target.value})} />
          <input type="number" className="input w-28" placeholder="R$" value={svcForm.default_price} onChange={e => setSvcForm({...svcForm, default_price: e.target.value})} />
          <button onClick={addService} className="btn-primary flex items-center gap-1"><Plus size={16} /></button>
        </div>
        <div className="space-y-2">
          {services.map((s: any) => (
            <div key={s.id} className="flex items-center justify-between bg-slate-700 rounded-lg px-3 py-2">
              <span className="text-sm">{s.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-blue-400">R$ {s.default_price.toFixed(2)}</span>
                <button onClick={() => deleteService(s.id)} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {services.length === 0 && <p className="text-slate-400 text-sm">Nenhum serviço extra cadastrado.</p>}
        </div>
      </div>
    </div>
  );
}
