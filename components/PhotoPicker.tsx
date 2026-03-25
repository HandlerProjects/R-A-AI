"use client";

import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PhotoPickerProps {
  preview: string | null;
  onSelect: (file: File, preview: string) => void;
  onRemove: () => void;
  accentColor?: string;
}

export function PhotoPicker({ preview, onSelect, onRemove, accentColor = "#007AFF" }: PhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onSelect(file, url);
    e.target.value = "";
  };

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleChange} />

      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{ position: "relative", marginTop: 10 }}
          >
            <img
              src={preview}
              alt="preview"
              style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 12, display: "block" }}
            />
            <button
              onClick={onRemove}
              style={{
                position: "absolute", top: 8, right: 8,
                width: 28, height: 28, borderRadius: "50%",
                background: "rgba(0,0,0,0.55)", border: "none",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="picker"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => inputRef.current?.click()}
            style={{
              marginTop: 8,
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 20,
              background: `${accentColor}12`,
              border: `1px dashed ${accentColor}50`,
              cursor: "pointer", fontSize: 12, fontWeight: 600,
              color: accentColor,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="13" r="4" stroke={accentColor} strokeWidth="2"/>
            </svg>
            Añadir foto
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}

export function PhotoDisplay({ url }: { url: string }) {
  return (
    <motion.img
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      src={url}
      alt="foto"
      style={{ width: "100%", borderRadius: 12, marginTop: 10, objectFit: "cover", maxHeight: 280, display: "block", cursor: "pointer" }}
      onClick={() => window.open(url, "_blank")}
    />
  );
}
