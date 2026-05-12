import { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ModelInk3D — Peças Disponíveis",
  description: "Catálogo de peças prontas para pronta entrega",
};

const API_URL = () =>
  process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getItems() {
  try {
    const res = await fetch(`${API_URL()}/stock/public`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getPublicSettings() {
  try {
    const res = await fetch(`${API_URL()}/settings/public`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default async function HomePage() {
  const [items, settings, headersList] = await Promise.all([
    getItems(),
    getPublicSettings(),
    headers(),
  ]);

  const whatsapp = settings?.whatsapp_number?.replace(/\D/g, "") ?? null;
  const host = headersList.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  const baseUrl = `${proto}://${host}`;

  const buildWhatsAppLink = (itemName: string, itemId: number) => {
    if (!whatsapp) return null;
    const productUrl = `${baseUrl}/vitrine/${itemId}`;
    const msg = `Oi! Vi na vitrine da *ModelInk3D* e tenho interesse em: *${itemName}*. Segue o link do produto: ${productUrl}. Pode me passar mais detalhes sobre disponibilidade e prazo?`;
    return `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">ModelInk3D</h1>
          <p className="text-slate-400">Peças disponíveis para pronta entrega</p>
        </div>

        {items.length === 0 ? (
          <p className="text-slate-400 text-center py-20">Nenhuma peça disponível no momento.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {items.map((item: any) => {
              const coverUrl = item.image_urls?.[0] ?? item.image_url ?? null;
              const waLink = buildWhatsAppLink(item.name, item.id);
              return (
                <div key={item.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col">
                  <Link href={`/vitrine/${item.id}`}>
                    {coverUrl ? (
                      <img src={coverUrl} alt={item.name} className="w-full h-40 object-cover hover:opacity-90 transition-opacity" />
                    ) : (
                      <div className="w-full h-40 bg-slate-700 flex items-center justify-center text-slate-500 text-4xl">📦</div>
                    )}
                  </Link>
                  <div className="p-3 flex flex-col flex-1">
                    <Link href={`/vitrine/${item.id}`} className="font-semibold text-white hover:text-blue-400 transition-colors leading-tight">
                      {item.name}
                    </Link>
                    {item.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-blue-400 font-bold text-lg">R$ {item.sell_price.toFixed(2)}</span>
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                        {item.quantity} un.
                      </span>
                    </div>
                    <div className="mt-3 flex flex-col gap-2">
                      {waLink && (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                        >
                          <WhatsAppIcon />
                          Quero esse!
                        </a>
                      )}
                      <Link href={`/vitrine/${item.id}`} className="text-center text-xs text-slate-400 hover:text-white transition-colors py-1">
                        Ver detalhes
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
