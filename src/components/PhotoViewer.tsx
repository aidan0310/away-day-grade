import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  photos: string[];
  initialIndex?: number;
  onClose: () => void;
}

export const PhotoViewer = ({ photos, initialIndex = 0, onClose }: Props) => {
  const [index, setIndex] = useState(initialIndex);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white"
      >
        <X className="h-5 w-5" />
      </button>

      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setIndex(i => Math.max(0, i - 1)); }}
            disabled={index === 0}
            className="absolute left-4 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIndex(i => Math.min(photos.length - 1, i + 1)); }}
            disabled={index === photos.length - 1}
            className="absolute right-4 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      <img
        src={photos[index]}
        alt="Match photo"
        className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl"
        onClick={(e) => e.stopPropagation()}
      />

      {photos.length > 1 && (
        <div className="absolute bottom-6 flex gap-2">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setIndex(i); }}
              className={`h-2 w-2 rounded-full transition-all ${i === index ? "bg-white w-4" : "bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};