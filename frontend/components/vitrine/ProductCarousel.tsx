"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  images: string[];
  name: string;
}

export default function ProductCarousel({ images, name }: Props) {
  const [current, setCurrent] = useState(0);

  if (images.length === 0) {
    return (
      <div className="w-full aspect-square bg-slate-700 rounded-2xl flex items-center justify-center text-slate-500 text-8xl border border-slate-600">
        📦
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className="rounded-2xl overflow-hidden bg-slate-800 border border-slate-700">
        <img src={images[0]} alt={name} className="w-full aspect-square object-cover" />
      </div>
    );
  }

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl overflow-hidden bg-slate-800 border border-slate-700">
        <img
          src={images[current]}
          alt={`${name} — foto ${current + 1}`}
          className="w-full aspect-square object-cover"
        />

        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
          aria-label="Foto anterior"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
          aria-label="Próxima foto"
        >
          <ChevronRight size={20} />
        </button>

        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-colors ${i === current ? "bg-white" : "bg-white/40"}`}
              aria-label={`Foto ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Miniaturas */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.map((url, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
              i === current ? "border-blue-500" : "border-slate-600 hover:border-slate-400"
            }`}
          >
            <img src={url} alt={`Miniatura ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
