"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Champ photo : redimensionne l'image dans le navigateur (max 1200 px, JPEG)
 * avant l'envoi, pour que les photos de téléphone restent légères.
 * Le fichier redimensionné remplace celui de l'input via DataTransfer.
 */
export function ImagePicker({ name = "image", id = "image" }: { name?: string; id?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(null);
      return;
    }
    setBusy(true);
    try {
      const resized = await resizeImage(file, 1200, 0.85);
      const dt = new DataTransfer();
      dt.items.add(resized);
      if (inputRef.current) inputRef.current.files = dt.files;
      setPreview(URL.createObjectURL(resized));
    } catch {
      // Si le redimensionnement échoue, on garde le fichier original
      setPreview(URL.createObjectURL(file));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {preview ? (
        <img src={preview} alt="" className="h-20 w-20 rounded-xl object-cover ring-1 ring-black/10" />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-gray-100 text-2xl">📷</div>
      )}
      <div className="flex-1">
        <input ref={inputRef} id={id} name={name} type="file" accept="image/jpeg,image/png,image/webp" onChange={onChange} className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100" />
        <p className="mt-1 text-xs text-gray-500">{busy ? "Préparation de l'image…" : "JPG, PNG ou WebP. Redimensionnée automatiquement."}</p>
      </div>
    </div>
  );
}

async function resizeImage(file: File, maxSize: number, quality: number): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.type === "image/jpeg" && file.size < 800 * 1024) return file;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", quality));
  if (!blob) throw new Error("toBlob");
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
}
