"use client";
import { useRef, useState } from "react";
import { Plus, X, ImageIcon } from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

const MAX_IMAGES = 8;

interface Props {
  values: string[];
  onChange: (urls: string[]) => void;
}

function resolveUrl(url: string) {
  if (url.startsWith("/uploads/")) {
    return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + url;
  }
  return url;
}

export default function MultiImageUpload({ values, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList) => {
    const remaining = MAX_IMAGES - values.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (!toUpload.length) return;

    setUploading(true);
    const results: string[] = [];
    for (const file of toUpload) {
      if (!file.type.startsWith("image/")) continue;
      try {
        const form = new FormData();
        form.append("file", file);
        const { data } = await api.post("/upload", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        results.push(data.url);
      } catch {
        toast.error(`Erro ao enviar ${file.name}`);
      }
    }
    setUploading(false);
    if (results.length) {
      onChange([...values, ...results]);
      toast.success(results.length === 1 ? "Imagem adicionada!" : `${results.length} imagens adicionadas!`);
    }
  };

  const remove = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {values.map((url, i) => (
          <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-600 shrink-0">
            <img src={resolveUrl(url)} alt={`Imagem ${i + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-0.5 transition-colors"
            >
              <X size={12} />
            </button>
            {i === 0 && (
              <span className="absolute bottom-0 left-0 right-0 text-center text-xs bg-black/60 text-white py-0.5">
                capa
              </span>
            )}
          </div>
        ))}

        {values.length < MAX_IMAGES && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => !uploading && inputRef.current?.click()}
            className={`w-24 h-24 rounded-lg border-2 border-dashed border-slate-600 hover:border-blue-500 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors shrink-0 ${uploading ? "opacity-50 cursor-wait" : ""}`}
          >
            {uploading ? (
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Plus size={20} className="text-slate-400" />
                <span className="text-xs text-slate-500">foto</span>
              </>
            )}
          </div>
        )}
      </div>

      {values.length === 0 && !uploading && (
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <ImageIcon size={12} /> Clique no botão acima ou arraste imagens. A primeira será a capa.
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); }}
      />
    </div>
  );
}
