"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Sélection de plusieurs photos, redimensionnées dans le navigateur (max 1400 px, JPEG)
 * pour que les photos de téléphone restent légères.
 */
export function MultiImagePicker({
  existing = [],
  onRemoveExisting,
  max = 6,
  name = "images",
}: {
  existing?: string[];
  onRemoveExisting?: (url: string) => void;
  max?: number;
  name?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(
    () => () => {
      previews.forEach((p) => URL.revokeObjectURL(p));
    },
    [previews],
  );

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = [...(e.target.files ?? [])].slice(0, Math.max(0, max));
    if (files.length === 0) {
      setPreviews([]);
      return;
    }
    setBusy(true);
    try {
      const resized = await Promise.all(files.map((f) => resizeImage(f, 1400, 0.85).catch(() => f)));
      const dt = new DataTransfer();
      resized.forEach((f) => dt.items.add(f));
      if (inputRef.current) inputRef.current.files = dt.files;
      setPreviews(resized.map((f) => URL.createObjectURL(f)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      {existing.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {existing.map((url) => (
            <div key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-20 w-20 rounded-lg object-cover ring-1 ring-black/10" />
              {onRemoveExisting && (
                <button
                  type="button"
                  onClick={() => onRemoveExisting(url)}
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs text-gray-500 shadow ring-1 ring-black/10 hover:text-red-600"
                  aria-label="Retirer cette photo"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previews.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt="" className="h-20 w-20 rounded-lg object-cover ring-2 ring-brand-500" />
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={max <= 0}
        onChange={onChange}
        className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
      />
      <p className="text-xs text-gray-500">
        {busy
          ? "Préparation des images…"
          : max <= 0
            ? "Maximum atteint : retirez une photo pour en ajouter une autre."
            : `JPG, PNG ou WebP. ${max} photo(s) de plus possible. Redimensionnées automatiquement.`}
      </p>
    </div>
  );
}

async function resizeImage(file: File, maxSize: number, quality: number): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.type === "image/jpeg" && file.size < 900 * 1024) return file;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", quality));
  if (!blob) throw new Error("toBlob");
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
}
