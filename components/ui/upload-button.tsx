import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadButtonProps {
  onUpload: (url: string, publicId: string) => void;
  type: "avatar" | "banner";
  currentImage?: string;
  children?: React.ReactNode;
  className?: string;
}

export function UploadButton({
  onUpload,
  type,
  currentImage,
  children,
  className,
}: UploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation côté client
    const maxSize = type === "avatar" ? 2 * 1024 * 1024 : 5 * 1024 * 1024; // 2MB ou 5MB
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Type de fichier invalide",
        description: "Utilisez uniquement JPG, PNG ou WebP.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > maxSize) {
      const maxSizeText = type === "avatar" ? "2MB" : "5MB";
      toast({
        title: "Fichier trop volumineux",
        description: `La taille maximale est de ${maxSizeText}.`,
        variant: "destructive",
      });
      return;
    }

    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de l'upload");
      }

      onUpload(result.url, result.publicId);

      toast({
        title: "Upload réussi",
        description: `${
          type === "avatar" ? "Photo de profil" : "Bannière"
        } mise à jour.`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erreur d'upload",
        description: "Une erreur s'est produite lors de l'upload.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        onClick={handleClick}
        disabled={isUploading}
        variant="secondary"
        size="sm"
        className={className}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : children ? (
          children
        ) : (
          <>
            <Upload className="h-4 w-4" />
            {type === "avatar" ? "Changer la photo" : "Changer la bannière"}
          </>
        )}
      </Button>
    </>
  );
}
