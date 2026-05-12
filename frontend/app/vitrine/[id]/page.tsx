import { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCarousel from "@/components/vitrine/ProductCarousel";

const API_URL = () =>
  process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getItem(id: string) {
  try {
    const res = await fetch(`${API_URL()}/stock/public/${id}`, { cache: "no-store" });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
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

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) return { title: "ModelInk3D" };
  return {
    title: `${item.name} — ModelInk3D`,
    description: item.description ?? `${item.name} disponível na vitrine da ModelInk3D`,
  };
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [item, settings, headersList] = await Promise.all([
    getItem(id),
    getPublicSettings(),
    headers(),
  ]);

  if (!item) notFound();

  // Merge image_url legado com image_urls novo
  const images: string[] = item.image_urls?.length
    ? item.image_urls
    : item.image_url
    ? [item.image_url]
    : [];

  const whatsapp = settings?.whatsapp_number?.replace(/\D/g, "") ?? null;
  const host = headersList.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  const productUrl = `${proto}://${host}/vitrine/${item.id}`;

  const waLink = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(
        `Oi! Vi na vitrine da *ModelInk3D* e tenho interesse em: *${item.name}*. Segue o link do produto: ${productUrl}. Pode me passar mais detalhes sobre disponibilidade e prazo?`
      )}`
    : null;

  const available = item.quantity > 0;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="border-b border-slate-700 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">
            ← Voltar para a vitrine
          </Link>
          <span className="font-bold text-white">ModelInk3D</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="md:grid md:grid-cols-2 md:gap-10 space-y-6 md:space-y-0">

          {/* Carrossel de imagens */}
          <ProductCarousel images={images} name={item.name} />

          {/* Info do produto */}
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl font-bold leading-tight">{item.name}</h1>
              {item.description && (
                <p className="text-slate-400 mt-2 leading-relaxed">{item.description}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-blue-400">
                R$ {item.sell_price.toFixed(2)}
              </span>
              <span
                className={`text-sm px-3 py-1 rounded-full font-medium ${
                  available
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {available ? `${item.quantity} disponível(is)` : "Sem estoque"}
              </span>
            </div>

            <div className="border-t border-slate-700 pt-4 space-y-3">
              <p className="text-sm text-slate-400">
                Negociação realizada diretamente pelo WhatsApp. Envie uma mensagem e nossa equipe responderá com prazo e condições.
              </p>

              {waLink ? (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 rounded-xl transition-colors text-lg w-full"
                >
                  <WhatsAppIcon />
                  Tenho interesse neste produto
                </a>
              ) : (
                <div className="bg-slate-700 rounded-xl py-4 px-4 text-center text-sm text-slate-400">
                  Entre em contato para mais informações.
                </div>
              )}
            </div>

            <Link
              href="/"
              className="text-center text-sm text-slate-500 hover:text-slate-300 transition-colors pt-2"
            >
              Ver outros produtos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
