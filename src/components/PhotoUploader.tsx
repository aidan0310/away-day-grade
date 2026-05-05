import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Camera, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  matchId?: string;
  photos: string[];
  onChange: (urls: string[]) => void;
}

export const PhotoUploader = ({ matchId, photos, onChange }: Props) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const uploadPhoto = async (file: File) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be under 5MB.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp", "image/heic"].includes(file.type)) {
      toast.error("Only JPG, PNG, WebP or HEIC images allowed.");
      return;
    }
    if (photos.length >= 3) {
      toast.error("Maximum 3 photos per review.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("match-photos")
        .upload(path, file, { upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("match-photos").getPublicUrl(path);
      onChange([...photos, data.publicUrl]);
      toast.success("Photo added!");
    } catch (err: any) {
      toast.error(err.message ?? "Could not upload photo");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (url: string) => {
    onChange(photos.filter(p => p !== url));
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {photos.map((url) => (
          <div key={url} className="relative h-20 w-20 rounded-xl overflow-hidden border border-border">
            <img src={url} alt="Match photo" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(url)}
              className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 flex items-center justify-center"
            >
              <X className="h-3 w-3 text-white" />
            </button>
          </div>
        ))}
        {photos.length < 3 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "h-20 w-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors",
              uploading && "opacity-50 cursor-not-allowed"
            )}
          >
            {uploading
              ? <Loader2 className="h-5 w-5 animate-spin" />
              : <><Camera className="h-5 w-5" /><span className="text-[10px] font-bold uppercase tracking-wider">Add</span></>
            }
          </button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadPhoto(file);
          e.target.value = "";
        }}
      />
    </div>
  );
};