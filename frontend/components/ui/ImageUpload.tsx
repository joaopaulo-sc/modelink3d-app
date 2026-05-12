"use client";
import { useRef, useState } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Props {
  value: string;           // URL atual
  onChange: (url: string) => void;
  className?: string;
}

export default function ImageUpload({ value, onChange, className = "" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const resolvedSrc = preview || (value ? (value.startsWith("/uploads/") ? `${API_URL}${value}` : value) : null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem (JPEG, PNG ou WebP)");
      return;
    }

    // Preview local imediato
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await api.post("/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(data.url);
      setPreview(null); // usa a URL real daqui em diante
      toast.success("Imagem enviada!");
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Erro ao enviar imagem");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={`relative w-full rounded-lg border-2 border-dashed transition-colors cursor-pointer overflow-hidden
          ${uploading ? "opacity-60 cursor-wait" : "hover:border-blue-500"}
          ${resolvedSrc ? "border-slate-600 h-44" : "border-slate-600 h-36 flex flex-col items-center justify-center gap-2"}`}
      >
        {resolvedSrc ? (
          <>
            <img src={resolvedSrc} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <span className="text-white text-sm font-medium flex items-center gap-2">
                <Upload size={16} /> Trocar imagem
              </span>
            </div>
          </>
        ) : (
          <>
            <ImageIcon size={28} className="text-slate-500" />
            <p className="text-slate-400 text-sm">Clique ou arraste uma imagem</p>
            <p className="text-slate-500 text-xs">JPEG, PNG ou WebP · máx. 5MB</p>
          </>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {resolvedSrc && (
        <button
          type="button"
          onClick={clear}
          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 transition-colors z-10"
          title="Remover imagem"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
